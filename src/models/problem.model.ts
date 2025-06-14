import mongoose, { Document, Schema } from "mongoose";
import {
  STUDENT_COLLECTION_NAME,
  PROBLEM_COLLECTION_NAME,
} from "./model-config";

export interface Problem extends Document {
  student: Schema.Types.ObjectId;
  contestId: number;
  index: string;
  name: string;
  rating: number;
  verdict: string;
  creationTime: Date;
  problemId: string;
}

const submissionSchema = new Schema<Problem>({
  student: {
    type: Schema.Types.ObjectId,
    ref: STUDENT_COLLECTION_NAME,
    required: true,
  },
  contestId: Number,
  index: String,
  name: String,
  rating: Number,
  verdict: String,
  creationTime: Date,
  problemId: String,
});

export const Problem = mongoose.model<Problem>(
  PROBLEM_COLLECTION_NAME,
  submissionSchema
);
