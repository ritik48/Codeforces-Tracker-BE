import mongoose, { Document, Schema } from "mongoose";

export interface User extends Document {
  username: string;
  password: string;
  role: "admin" | "user";
}
export const USER_COLLECTION_NAME = "User";

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "user"],
  },
});

export const User = mongoose.model<User>(USER_COLLECTION_NAME, userSchema);
