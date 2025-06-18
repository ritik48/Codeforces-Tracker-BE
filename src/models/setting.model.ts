import mongoose, { Document, Schema } from "mongoose";
import { SETTING_COLLECTION_NAME } from "./model-config";

export interface SettingDocument extends Document {
  cron_time: string;
}

const settingSchema = new Schema<SettingDocument>({
  cron_time: {
    type: String,
    required: true,
    default: "0 0 * * *", // default to run every day at midnight
  },
});

export const Setting = mongoose.model<SettingDocument>(
  SETTING_COLLECTION_NAME,
  settingSchema
);
