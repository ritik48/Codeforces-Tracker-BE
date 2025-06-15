import mongoose from "mongoose";
import { User } from "./models/user.model";
import { Student } from "./models/student.model";

const addAdmin = async () => {
  await User.deleteMany();

  const username = process.argv[2];
  const password = process.argv[3];
  const role = process.argv[4] || "admin";

  await User.create({ username, password, role });
};

const addUser = async () => {
  await Student.deleteMany();

  const cf_handle = process.argv[2];

  await Student.create({ cf_handle });
};

const main = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/tle_cf_management"
    );

    // await addAdmin();
    await addUser();
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

main();
