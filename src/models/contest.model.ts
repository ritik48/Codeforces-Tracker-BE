import mongoose, { Document, Schema } from "mongoose";
import {
  CONTEST_COLLECTION_NAME,
  STUDENT_COLLECTION_NAME,
} from "./model-config";

export interface ContestDocument extends Document {
  student: Schema.Types.ObjectId;
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingUpdateTimeSeconds: Date;
  unsolvedProblems: number;
}

const contestSchema = new Schema<ContestDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: STUDENT_COLLECTION_NAME,
    required: true,
  },
  contestId: Number,
  contestName: String,
  rank: Number,
  oldRating: Number,
  newRating: Number,
  ratingUpdateTimeSeconds: Date,
  unsolvedProblems: Number,
});

export const Contest = mongoose.model<ContestDocument>(
  CONTEST_COLLECTION_NAME,
  contestSchema
);
