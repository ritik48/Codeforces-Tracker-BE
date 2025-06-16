import { get } from "http";
import { syncStudentData } from "../cron";
import { Contest } from "../models/contest.model";
import { Student } from "../models/student.model";
import { Submission, SubmissionDocument } from "../models/submission.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import {
  getAverageProblemPerDay,
  getMostDifficultProblem,
  getRatingBucketData,
  getSubmissionHeatMap,
  getTotalSovledProblems,
} from "../utils/helper";

export const fetchAllStudents = asyncHandler(async (req, res) => {
  const page = parseInt((req.query.page || "1") as string);
  const limit = parseInt((req.query.limit || "10") as string);

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find().skip(skip).limit(limit),
    Student.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: students,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, cf_handle } = req.body;

  if (!cf_handle) {
    throw new ApiError("CF Handle is required", 400);
  }
  const payload = {
    cf_handle,
    ...(name && { name }),
    ...(email && { email }),
    ...(phone && { phone }),
  };

  const exisingStudent = await Student.findOne({ cf_handle });
  if (exisingStudent) {
    throw new ApiError("CF Handle already exists", 400);
  }

  const student = new Student(payload);
  await student.save();

  // sync current student
  await syncStudentData(student);

  const updated_student = await Student.findById(student._id);

  res.status(201).json({ success: true, data: updated_student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, cf_handle, phone } = req.body;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }

  if (!cf_handle) {
    throw new ApiError("CF Handle is required", 400);
  }

  // Only update fields if they are provided
  if (name !== undefined) {
    student.name = name;
  }
  if (email !== undefined) {
    student.email = email;
  }
  if (phone !== undefined) {
    student.phone = phone;
  }

  const old_cf_handle = student.cf_handle;
  student.cf_handle = cf_handle;

  await student.save();

  // TODO: Instead of syncing here, we can push it into a queue and sync it asynchronously
  if (old_cf_handle !== cf_handle) {
    // delete the old contests, submission for the old cf_handle
    await Contest.deleteMany({ student: student._id });
    await Submission.deleteMany({ student: student._id });

    // sync the new contests, submission for the new cf_handle
    await syncStudentData(student);
  }

  res.status(200).json({ success: true, data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }

  await Student.findByIdAndDelete(id);

  // delete the contests, submission for the student
  await Contest.deleteMany({ student: id });
  await Submission.deleteMany({ student: id });

  res
    .status(200)
    .json({ success: true, message: "Student deleted successfully" });
});

export const fetchStudentContestHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError("Student ID is required", 400);
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }

  const days = parseInt((req.query.days || "90") as string);

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log({ fromDate });

  // fetch contest adter the from date and sort it in ascending order
  const contests = await Contest.find({
    student: id,
    ratingUpdateTimeSeconds: { $gte: fromDate },
  }).sort({ ratingUpdateTimeSeconds: 1 });

  res.status(200).json({
    success: true,
    data: contests.map((c) => ({
      contestName: c.contestName,
      date: c.ratingUpdateTimeSeconds,
      oldRating: c.oldRating,
      newRating: c.newRating,
      rank: c.rank,
      unsolvedProblems: c.unsolvedProblems,
    })),
  });
});

export const fetchStudentSubmissionData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const days = parseInt((req.query.days || "7") as string);

  if (!id) {
    throw new ApiError("Student ID is required", 400);
  }

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const solvedSubmissions = await Submission.find({
    student: id,
    verdict: "OK",
    creationTime: { $gte: sinceDate },
  });

  // MOST DIFFICULT PROBLEM
  const mostDifficultProblem = getMostDifficultProblem(solvedSubmissions);

  // TOTAL SOLVED PROBLEMS
  const totalSolvedProblems = getTotalSovledProblems(solvedSubmissions);

  // AVERAGE RATING OF SOLVED PROBLEMS
  const totalRating = solvedSubmissions.reduce(
    (prev, cur) => prev + cur.rating,
    0
  );
  const averageRating = totalRating / totalSolvedProblems;

  // AVERAGE PROBLEM PER DAY
  const averageProblemPerDay = getAverageProblemPerDay(
    solvedSubmissions,
    totalSolvedProblems
  );

  // SPOLVED PROBLEMS PER RATING BUCKET
  const ratingBucketData = getRatingBucketData(solvedSubmissions);

  // SUBMISSION HEAt MAP - NUMBER OF SUBMISSION EVERY DAY
  const heatmap = getSubmissionHeatMap(solvedSubmissions, days);

  res.status(200).json({
    success: true,
    data: {
      mostDifficultProblem,
      totalSolvedProblems,
      averageRating,
      averageProblemPerDay,
      ratingBucketData,
      heatmap,
    },
  });
});
