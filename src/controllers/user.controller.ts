import { CookieOptions, NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { generateToken } from "../utils/token-helpers";

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  res
    .status(200)
    .cookie("token", token, cookieOptions)
    .send({ success: true, message: "Login successful" });
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({ user: req.user, success: true });
  } catch (error) {
    next(error);
  }
};
