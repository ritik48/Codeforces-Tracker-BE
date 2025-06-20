import cron, { ScheduledTask } from "node-cron";
import { Setting } from "../models/setting.model";
import { runTask } from ".";

let scheduledTask: ScheduledTask | null = null;

export const startCronJob = async () => {
  const setting = await Setting.findOne();

  // create a entry in setting if it does not exist
  if (!setting) {
    await Setting.create({ cron_time: "0 0 * * *" });
  }

  const cronTime = setting?.cron_time || "0 0 * * *";

  if (scheduledTask) scheduledTask.stop();

  if (cron.validate(cronTime)) {
    scheduledTask = cron.schedule(cronTime, async () => {
      console.log("Running cron task at", new Date().toLocaleString());
      await runTask();
    }, {timezone: "UTC"});
    
    console.log("Cron job scheduled at:", cronTime);

    return { success: true, message: "Cron job scheduled successfully" };
  }
  console.error("Invalid cron expression from DB:", cronTime);

  return { success: false, message: "Invalid cron expression from DB" };
};
