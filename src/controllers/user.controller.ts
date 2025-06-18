import { CookieOptions, NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { generateToken } from "../utils/token-helpers";
import { Setting } from "../models/setting.model";
import { asyncHandler } from "../utils/AsyncHandler";
import { startCronJob } from "../cron/cron-init";
import cron from "node-cron";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ApiError("Missing username or password", 400);
    }

    const user = await User.findOne({ username });
    if (!user) {
      throw new ApiError("Invalid username or password", 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new ApiError("Invalid username or password", 401);
    }

    const token = generateToken(user._id as string);

    res
      .status(200)
      .cookie("token", token, cookieOptions)
      .send({ success: true, message: "Login successful" });
  }
);

export const getUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ user: req.user, success: true });
    } catch (error) {
      next(error);
    }
  }
);

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("token", cookieOptions).status(200).json({ success: true });
};

export const updateCron = asyncHandler(async (req, res) => {
  const { cron_time } = req.body;

  if (!cron_time) {
    throw new ApiError("Cron time is required", 400);
  }

  if (!cron.validate(cron_time)) {
    throw new ApiError("Invalid cron time", 400);
  }
  const setting = await Setting.findOne();

  // update setting if it is present else create new entry
  if (setting) {
    setting.cron_time = cron_time;
    await setting.save();
  } else {
    const new_setting = new Setting({ cron_time });
    await new_setting.save();
  }

  await startCronJob();

  res.status(200).json({ success: true, message: "Updated successfully" });
});

export const fetchCron = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne();

  if (!setting) {
    throw new ApiError("Cron time is not set", 400);
  }

  res.status(200).json({ success: true, cron_time: setting.cron_time });
});
