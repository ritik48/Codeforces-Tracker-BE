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
import path, { parse } from "path";
import fs from "fs";

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

export const fetchStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError("Student ID is required", 400);
  }
  console.log("Fetching student with ID:", id);
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }
  res.status(200).json({ success: true, data: student });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, cf_handle } = req.body;

  if (!cf_handle) {
    throw new ApiError("CF Handle is required", 400);
  }
  const payload = {
    cf_handle,
    ...(name && { name }),
    ...(email === "" ? { email: undefined } : { email }),
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

  const old_cf_handle = student.cf_handle;
  student.cf_handle = cf_handle;

  student.name = name || "";
  student.email = email === "" ? undefined : email; // allow empty email
  student.phone = phone || "";

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
  console.log({ page: req.query.page, limit: req.query.limit });

  const page = req.query.page;
  const limit = req.query.limit;

  const days = parseInt((req.query.days || "90") as string);

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // based on whether page and limit provided we will decide send paginated data or not

  let contests,
    total = 0;
  if (page && limit) {
    [contests, total] = await Promise.all([
      Contest.find({
        student: id,
        ratingUpdateTimeSeconds: { $gte: fromDate },
      })
        .sort({ ratingUpdateTimeSeconds: 1 })
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .limit(parseInt(limit as string)),

      Contest.countDocuments({
        student: id,
        ratingUpdateTimeSeconds: { $gte: fromDate },
      }),
    ]);
  } else {
    contests = await Contest.find({
      student: id,
      ratingUpdateTimeSeconds: { $gte: fromDate },
    }).sort({ ratingUpdateTimeSeconds: 1 });
  }

  console.log({ contests, total });

  res.status(200).json({
    success: true,
    data: contests.map((c) => ({
      _id: c._id,
      contestName: c.contestName,
      date: c.ratingUpdateTimeSeconds,
      oldRating: c.oldRating,
      newRating: c.newRating,
      rank: c.rank,
      unsolvedProblems: c.unsolvedProblems,
    })),
    pagination: {
      total,
      page: parseInt((page || "1") as string),
      limit: parseInt((limit || "10") as string),
      totalPages: Math.ceil(total / parseInt((limit || "10") as string)),
    },
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

export const downloadStudentData = asyncHandler(async (req, res) => {
  const students = await Student.find({}).lean();

  if (students.length === 0) {
    res.status(404).json({ message: "No students found" });
  }

  const header = [
    "Name",
    "Email",
    "Phone",
    "CF Handle",
    "Current Rating",
    "Max Rating",
  ].join(",");

  const rows = students.map((student) => [
    student.name || "",
    student.email || "",
    student.phone || "",
    student.cf_handle || "",
    student.current_rating || "",
    student.max_rating || "",
  ]);

  const csvContent = [header, ...rows].join("\n");

  // temp directory exists in root of the project, and create it if not exists
  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  // Create a temporary file path
  const tempFilePath = path.join(tempDir, `students_${Date.now()}.csv`);
  fs.writeFileSync(tempFilePath, csvContent);

  res.download(tempFilePath, "students2.csv", (err) => {
    //delete the temp file after download
    fs.unlink(tempFilePath, (unlinkErr) => {
      if (unlinkErr) console.error("Failed to delete temp file:", unlinkErr);
    });

    if (err) {
      console.error("Download failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Download failed" });
      }
    }
  });
});
