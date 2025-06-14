import mongoose, { Document, ObjectId, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser {
  username: string;
  password: string;
  role: "admin" | "user";
}

export interface UserDocument extends IUser, Document {
  comparePassword: (password: string) => Promise<boolean>;
}

export const USER_COLLECTION_NAME = "User";

const userSchema = new Schema<UserDocument>({
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

userSchema.methods.comparePassword = async function (
  this: UserDocument,
  password: string
) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const User = mongoose.model<UserDocument>(
  USER_COLLECTION_NAME,
  userSchema
);
