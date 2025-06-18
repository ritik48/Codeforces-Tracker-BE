const BASE_URL = "https://codeforces.com/api";

interface StudentResponseType {
  status: "OK" | "FAILED";
  comment?: string;
  result: {
    rating?: number;
    maxRating?: number;
    firstName?: string;
    lastName?: string;
    rank?: string;
    maxRank?: string;
  }[];
}

interface RatingResponseType {
  status: "OK" | "FAILED";
  comment?: string;
  result: {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
  }[];
}

interface Problem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  points: number;
  rating: number;
  tags: string[];
}

interface Submission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  problem: Problem;
  programmingLanguage: string;
  verdict: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

interface SubmissionResponseType {
  status: "OK" | "FAILED";
  comment?: string;
  result: Submission[];
}

export const fetchStudentData = async (cf_handle: string) => {
  /*
    =============== SAMPLE DATA ==================
    {
      "lastName": "Khodyrev",
      "lastOnlineTimeSeconds": 1742481459,
      "rating": 1709,
      "friendOfCount": 95,
      "titlePhoto": "https://userpic.codeforces.org/1592/title/27e43714e4bea090.jpg",
      "handle": "DmitriyH",
      "avatar": "https://userpic.codeforces.org/1592/avatar/7cef566902732053.jpg",
      "firstName": "Dmitriy",
      "contribution": 0,
      "organization": "",
      "rank": "expert",
      "maxRating": 2072,
      "registrationTimeSeconds": 1268570311,
      "maxRank": "candidate master"
    }

    Observation: Some faileds may not be present. So kept them optional in type.
  */

  const url = BASE_URL + `/user.info?handles=${cf_handle}`;

  try {
    const res = await fetch(url);
    const data: StudentResponseType = await res.json();

    console.log({ data });

    if (data.status !== "OK")
      return {
        success: false,
        message: data.comment || "Could not fetch the profile.",
      };

    return { success: true, data: data.result[0] };
  } catch (error) {
    console.log({ error });
    return { success: false, message: "Could not fetch the profile." };
  }
};

export const fetchStudentRatings = async (cf_handle: string) => {
  /*
    =============== SAMPLE DATA ==================
    
    "result": [
      {
        "contestId": 1,
        "contestName": "Codeforces Beta Round 1",
        "handle": "Fefer_Ivan",
        "rank": 30,
        "ratingUpdateTimeSeconds": 1266588000,
        "oldRating": 0,
        "newRating": 1502
      },
      {
        "contestId": 2,
        "contestName": "Codeforces Beta Round 2",
        "handle": "Fefer_Ivan",
        "rank": 46,
        "ratingUpdateTimeSeconds": 1267124400,
        "oldRating": 1502,
        "newRating": 1521
      }
    ]
  */

  const url = BASE_URL + `/user.rating?handle=${cf_handle}`;

  try {
    const res = await fetch(url);
    const data: RatingResponseType = await res.json();

    if (data.status !== "OK")
      return {
        success: false,
        message: data.comment || "Could not fetch users ratings",
      };

    return { success: true, data: data.result };
  } catch (error) {
    return { success: false, message: "Could not fetch users ratings" };
  }
};

export const fetchStudentSubmissions = async (cf_handle: string) => {
  const url = BASE_URL + `/user.status?handle=${cf_handle}`;

  /*
    =============== SAMPLE DATA ==================
    
    "result": [
    {
      "id": 157298399,
      "contestId": 1677,
      "creationTimeSeconds": 1652613839,
      "relativeTimeSeconds": 2147483647,
      "problem": {
        "contestId": 1677,
        "index": "A",
        "name": "Tokitsukaze and Strange Inequality",
        "type": "PROGRAMMING",
        "points": 500,
        "rating": 1600,
        "tags": [
          "brute force",
          "data structures",
          "dp"
        ]
      },
      "author": {
        "contestId": 1677,
        "participantId": 133161991,
        "members": [
          {
            "handle": "Fefer_Ivan"
          }
        ],
        "participantType": "PRACTICE",
        "ghost": false,
        "startTimeSeconds": 1652020500
      },
      "programmingLanguage": "C++17 (GCC 7-32)",
      "verdict": "OK",
      "testset": "TESTS",
      "passedTestCount": 68,
      "timeConsumedMillis": 171,
      "memoryConsumedBytes": 202240000
      },
    ]
  */

  try {
    const res = await fetch(url);
    const data: SubmissionResponseType = await res.json();

    if (data.status !== "OK")
      return {
        success: false,
        message: data.comment || "Could not fetch users contests",
      };

    return { success: true, data: data.result };
  } catch (error) {
    return { success: false, message: "Could not fetch users contests" };
  }
};
