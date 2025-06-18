import mongoose, { Document, Schema } from "mongoose";
import { STUDENT_COLLECTION_NAME } from "./model-config";

export interface Student extends Document {
  name: string;
  email: string;
  phone: string;
  cf_handle: string;
  current_rating: number;
  max_rating: number;
  allow_email: boolean;
  reminder_count: number;
  rank?: string;
  max_rank?: string;
}

const studentSchema = new Schema<Student>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows for unique email or no email
    },
    phone: {
      type: String,
    },
    cf_handle: {
      type: String,
      unique: true,
      required: true,
    },
    current_rating: {
      type: Number,
    },
    max_rating: {
      type: Number,
    },
    allow_email: {
      type: Boolean,
      default: true,
    },
    reminder_count: {
      type: Number,
      default: 0,
    },
    rank: String,
    max_rank: String,
  },
  { timestamps: true }
);

export const Student = mongoose.model<Student>(
  STUDENT_COLLECTION_NAME,
  studentSchema
);
