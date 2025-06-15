const BASE_URL = "https://codeforces.com/api";

interface StudentResponseType {
  status: "OK" | "FAILED";
  comment?: string;
  result: {
    rating?: number;
    maxRating?: number;
    firstName?: string;
    lastName?: string;
  }[];
}
/*
=================== SAMPLE DATA ====================
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

const fetchStudentData = async (cf_handle: string) => {
  const url = BASE_URL + `/user.info?handles=${cf_handle}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, message: "Could not fetch the profile." };
    }
    const data: StudentResponseType = await res.json();

    if (data.status !== "OK") return { success: false, message: data.comment };

    return { success: true, data: data.result[0] };
  } catch (error) {
    console.log({ error });
    return { success: false, message: "Could not fetch the profile." };
  }
};
