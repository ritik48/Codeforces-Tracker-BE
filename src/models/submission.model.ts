import mongoose, { Document, Schema } from "mongoose";
import {
  STUDENT_COLLECTION_NAME,
  SUBMISSION_COLLECTION_NAME,
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
});

export const Submission = mongoose.model<SubmissionDocument>(
  SUBMISSION_COLLECTION_NAME,
  submissionSchema
);
