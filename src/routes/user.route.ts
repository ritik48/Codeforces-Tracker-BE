import express, {
  CookieOptions,
  NextFunction,
  Request,
  Response,
} from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { generateToken } from "../utils/token-helpers";
import { isAuthenticated } from "../utils/middleware";
import { asyncHandler } from "../utils/AsyncHandler";
import {
  fetchCron,
  getUser,
  loginUser,
  logoutUser,
  updateCron,
} from "../controllers/user.controller";

const router = express.Router();

router.post("/login", asyncHandler(loginUser));
router.post("/logout", asyncHandler(logoutUser));
router.get("/user", isAuthenticated, asyncHandler(getUser));
router.patch("/cron", isAuthenticated, asyncHandler(updateCron));
router.get("/cron", isAuthenticated, asyncHandler(fetchCron));

export { router as userRouter };
