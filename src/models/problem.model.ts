import mongoose, { Document, Schema } from "mongoose";
import {
  STUDENT_COLLECTION_NAME,
  PROBLEM_COLLECTION_NAME,
} from "./model-config";

export interface SubmissionDocument extends Document {
  student: Schema.Types.ObjectId;
  submissionId: number;
  contestId: number;
  index: string;
  name: string;
  rating: number;
  verdict: string;
  creationTime: Date;
  problemId: string;
}

const submissionSchema = new Schema<SubmissionDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: STUDENT_COLLECTION_NAME,
    required: true,
  },
  submissionId: Number,
  contestId: Number,
  index: String,
  name: String,
  rating: Number,
  verdict: String,
  creationTime: Date,
  problemId: String,
});

export const Problem = mongoose.model<SubmissionDocument>(
  PROBLEM_COLLECTION_NAME,
  submissionSchema
);
