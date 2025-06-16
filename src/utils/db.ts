import mongoose from "mongoose";
import { config } from "dotenv";
config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/tle_cf_management";

export const connectDB = async () => {
  await mongoose.connect(MONGODB_URI);
};
