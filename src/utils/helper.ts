import { SubmissionDocument } from "../models/submission.model";

export const getSubmissionHeatMap = (
  submissions: SubmissionDocument[],
  days: number
) => {
  const heatmapData: Record<string, number> = {};

  submissions.forEach((sub) => {
    const dateStr = sub.creationTime.toISOString().split("T")[0];
    heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
  });

  // we need to get all the days for the given date range, even if no submission was made on that day
  const allDates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    allDates.push(date.toISOString().split("T")[0]);
  }

  const heatmap = allDates.map((date) => ({
    date,
    count: heatmapData[date] || 0,
  }));

  return heatmap;
};

export const getRatingBucketData = (submissions: SubmissionDocument[]) => {
  const buckets: Record<string, number> = {};

  // keeping bucket size as 200
  submissions.forEach((sub) => {
    if (!sub.rating) return;
    const bucketStart = Math.floor(sub.rating / 200) * 200;
    const bucketEnd = bucketStart + 199;
    const label = `${bucketStart}-${bucketEnd}`;
    buckets[label] = (buckets[label] || 0) + 1;
  });

  const ratingBucketData = Object.entries(buckets).map(([label, count]) => ({
    label,
    count,
  }));

  return ratingBucketData;
};

export const getAverageProblemPerDay = (
  submissions: SubmissionDocument[],
  totalSolvedProblems: number
) => {
  // for this we need to find all the days in which the student has solved a problem

  const activeDays = new Set(
    submissions.map((sub) => sub.creationTime.toISOString().split("T")[0])
  );
  const averageProblemPerDay = totalSolvedProblems / activeDays.size;
};

export const getMostDifficultProblem = (submissions: SubmissionDocument[]) => {
  return submissions.reduce(
    (prev, cur) => (prev.rating > cur.rating ? prev : cur),
    submissions[0]
  );
};

export const getTotalSovledProblems = (submissions: SubmissionDocument[]) => {
  // use set to avoid counting the same problem twice
  const uniqueProblems: Record<string, SubmissionDocument> = {};

  submissions.forEach((s) => {
    const key = `${s.contestId}-${s.index}`;
    if (!uniqueProblems[key]) {
      uniqueProblems[key] = s;
    }
  });

  return Object.keys(uniqueProblems).length;
};
