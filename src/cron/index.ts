import {
  fetchStudentData,
  fetchStudentRatings,
  fetchStudentSubmissions,
} from "../cf-api";
import { Contest } from "../models/contest.model";
import { Submission } from "../models/submission.model";
import { Student } from "../models/student.model";
import { sendEmail } from "../utils/helper";

import pLimit from "p-limit";

export const runTask = async () => {
  console.log("Running sync task...");
  const startTime = Date.now();
  const students = await Student.find();

  // limit 5 concurrent requests
  const limit = pLimit(2);

  const results = await Promise.allSettled(
    students.map((student) => limit(() => syncStudentData(student)))
  );

  let totalSuccess = 0;
  let totalFailure = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        totalSuccess++;
        console.log(`${result.value.cf_handle}: success`);
      } else {
        totalFailure++;
        console.log(`${result.value.cf_handle}: failed`);
      }
    }
  });

  const durationMs = Date.now() - startTime;
  const seconds = (durationMs / 1000).toFixed(2);

  console.log(`Sync completed in: ${seconds}s`);
  console.log(`Total success: ${totalSuccess}, total failure: ${totalFailure}`);

  // check for inactive students
  await checkInactiveStudents();
};

export const syncStudentData = async (student: Student) => {
  // delay every student sync to avoid rate limiting
  await new Promise((r) => setTimeout(r, 500));

  let { success, message } = await addStudentToDB(student);
  if (!success)
    return { success: false, message, cf_handle: student.cf_handle };

  // add contests
  ({ success, message } = await addContestToDB(
    student.cf_handle,
    student._id as string
  ));
  if (!success)
    return { success: false, message, cf_handle: student.cf_handle };

  // add submission
  ({ success, message } = await addSubmissionsToDB(
    student.cf_handle,
    student._id as string
  ));

  if (!success)
    return { success: false, message, cf_handle: student.cf_handle };

  // update the total_unsolved problems in a contest
  const contests = await Contest.find({ student: student._id });

  const bulkWriteObject = [];
  for (let contest of contests) {
    const total_unsolved = await calculateUnsolvedProblems(
      contest.contestId,
      student._id as string
    );

    bulkWriteObject.push({
      updateOne: {
        filter: { contestId: contest.contestId, student: student._id },
        update: { $set: { unsolvedProblems: total_unsolved } },
      },
    });
  }

  // update the contest with unsolve_problems count in a bulk write
  await Contest.bulkWrite(bulkWriteObject);

  // update sync time for this student
  await Student.findByIdAndUpdate(student._id, { last_sync: new Date() });

  return {
    success: true,
    message: "Synced successfully",
    cf_handle: student.cf_handle,
  };
};

const addStudentToDB = async (student: Student) => {
  const cf_handle = student.cf_handle;

  const student_data = await fetchStudentData(cf_handle);
  if (!student_data.success) {
    console.log(`CF ID: ${cf_handle}\n${student_data.message}`);
    return { success: false, message: student_data.message };
  }
  const student_payload = {
    current_rating: student_data.data?.rating || 0,
    max_rating: student_data.data?.maxRating || 0,
    name: `${student_data.data?.firstName || ""} ${
      student_data.data?.lastName || ""
    }`.trim(),
    rank: student_data.data?.rank || "",
    max_rank: student_data.data?.maxRank || "",
    profile_picture: student_data.data?.titlePhoto
      ? student_data.data?.titlePhoto !==
        "https://userpic.codeforces.org/no-title.jpg"
        ? student_data.data?.titlePhoto
        : ""
      : "",
  };

  await Student.findByIdAndUpdate(student._id, student_payload);

  return { success: true, message: "Student updated successfully" };
};

const addContestToDB = async (cf_handle: string, student_id: string) => {
  const contest_data = await fetchStudentRatings(cf_handle);
  if (!contest_data.success) {
    console.log(`CF ID: ${cf_handle}\n${contest_data.message}`);
    return { success: false, message: contest_data.message };
  }

  // get exising contests data so that we save the new contest after it not already exists in the db
  const existing_contests = await Contest.find({ student: student_id });

  const all_contests = contest_data.data || [];

  const new_contest_data = [];
  for (let contest of all_contests) {
    const contest_payload = {
      contestId: contest.contestId,
      contestName: contest.contestName,
      student: student_id,
      rank: contest.rank,
      oldRating: contest.oldRating,
      newRating: contest.newRating,
      ratingUpdateTimeSeconds: new Date(contest.ratingUpdateTimeSeconds * 1000),
    };

    new_contest_data.push(contest_payload);
  }
  const existingIds = new Set(existing_contests.map((ec) => ec.contestId));

  // get those data whose ids do not exists in the db
  const contest_to_save = new_contest_data.filter(
    (nc) => !existingIds.has(nc.contestId)
  );

  // save all the new contests
  await Contest.create(contest_to_save);

  return { success: true, message: "Contests updated successfully" };
};

const addSubmissionsToDB = async (cf_handle: string, student_id: string) => {
  const submission_data = await fetchStudentSubmissions(cf_handle);

  if (!submission_data.success) {
    console.log(`CF ID: ${cf_handle}\n${submission_data.message}`);
    return { success: false, message: submission_data.message };
  }

  // get exising submissions data so that we only save the new submission after comparing
  const existing_submissions = await Submission.find({ student: student_id });

  const all_submissions = submission_data.data || [];

  const new_submissions_data = [];
  for (let submission of all_submissions) {
    const submission_payload = {
      student: student_id,
      contestId: submission.contestId,
      index: submission.problem.index,
      name: submission.problem.name,
      rating: submission.problem.rating,
      verdict: submission.verdict,
      submissionId: submission.id,
      creationTime: new Date(submission.creationTimeSeconds * 1000),
    };

    new_submissions_data.push(submission_payload);
  }
  const existingIds = new Set(
    existing_submissions.map((es) => es.submissionId)
  );

  // get those data whose ids do not exists in the db
  const submissions_to_save = new_submissions_data.filter(
    (ns) => !existingIds.has(ns.submissionId)
  );

  // save all the new contests
  await Submission.create(submissions_to_save);

  return { success: true, message: "Submissions updated successfully" };
};

const calculateUnsolvedProblems = async (
  contest_id: number,
  student_id: string
) => {
  const submissions = await Submission.find({
    contestId: contest_id,
    student: student_id,
  });

  const attempted_problems = new Set();
  const solved_problems = new Set();

  submissions.forEach((sub) => {
    const key = `${sub.contestId}-${sub.index}`;
    attempted_problems.add(key);

    if (sub.verdict === "OK") {
      solved_problems.add(key);
    }
  });

  const total_unsolved = attempted_problems.size - solved_problems.size;
  return total_unsolved;
};

const checkInactiveStudents = async () => {
  // last 7 days
  const inactiveDRange = 7;

  // get submission data for the last 7 days
  const submissions = await Submission.find({
    creationTime: {
      $gte: new Date(Date.now() - inactiveDRange * 24 * 60 * 60 * 1000),
    },
  });

  const studentIds = new Set(submissions.map((s) => s.student));

  // Convert Set to Array for MongoDB query
  const studentIdsArray = Array.from(studentIds);

  // fetch students whose ids do not exist in the submissions, and they have email set and allow_email is true
  const inactiveStudents = await Student.find({
    _id: { $nin: studentIdsArray },
    email: { $exists: true },
    allow_email: true,
  });

  inactiveStudents.forEach((s) => {
    console.log(`Inactive student: ${s.name}`);
  });

  // batch the email in group of 3 and send them in parallel
  const limit = pLimit(3);

  const emailTasks = inactiveStudents.map((student) =>
    limit(async () => {
      console.log(`Sending email to inactive student: ${student.cf_handle}`);

      try {
        await sendEmail(student.email, student.name || student.cf_handle);

        // Increment reminder_count
        student.reminder_count += 1;
        await student.save();

        console.log(`✅ Email sent to ${student.email}`);
      } catch (error) {
        console.error(`❌ Failed to send email to ${student.email}:`, error);
      }
    })
  );

  const emailResults = await Promise.allSettled(emailTasks);
  console.log("Emails sent.");

  const totalEmailSuccess = emailResults.filter(
    (result) => result.status === "fulfilled"
  ).length;
  const totalEmailFailure = emailTasks.length - totalEmailSuccess;

  console.log(
    `Total Emails Success: ${totalEmailSuccess}, total emails failure: ${totalEmailFailure}`
  );
};
