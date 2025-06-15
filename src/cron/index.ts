import { fetchStudentData, fetchStudentRatings } from "../cf-api";
import { Contest } from "../models/contest.model";
import { Student } from "../models/student.model";

export const runTask = async () => {
  const students = await Student.find();

  for (let student of students) {
    let success = await addStudentToDB(student);
    if (!success) continue;

    success = await addContestToDB(student.cf_handle, student._id as string);
    if (!success) continue;
  }
};

const addStudentToDB = async (student: Student) => {
  const cf_handle = student.cf_handle;

  const student_data = await fetchStudentData(cf_handle);
  if (!student_data.success) {
    console.log(`CF ID: ${cf_handle}\n${student_data.message}`);
    return false;
  }
  const student_payload = {
    current_rating: student_data.data?.rating || 0,
    max_rating: student_data.data?.maxRating || 0,
    name: `${student_data.data?.firstName || ""} ${
      student_data.data?.lastName || ""
    }`.trim(),
  };

  await Student.findByIdAndUpdate(student._id, student_payload);

  return true;
};

const addContestToDB = async (cf_handle: string, student_id: string) => {
  const contest_data = await fetchStudentRatings(cf_handle);
  if (!contest_data.success) {
    console.log(`CF ID: ${cf_handle}\n${contest_data.message}`);
    return false;
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

  return true;
};

runTask();
