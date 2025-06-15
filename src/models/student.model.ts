import mongoose, { Document, Schema } from "mongoose";
import { STUDENT_COLLECTION_NAME } from "./model-config";

export interface Student extends Document {
  name: string;
  email: string;
  phone: string;
  cf_handle: string;
  current_rating: number;
  max_rating: number;
}

const studentSchema = new Schema<Student>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    phone: {
      type: String,
    },
    cf_handle: {
      type: String,
      required: true,
    },
    current_rating: {
      type: Number,
    },
    max_rating: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Student = mongoose.model<Student>(
  STUDENT_COLLECTION_NAME,
  studentSchema
);
