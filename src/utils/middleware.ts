import { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";
import { verifyToken } from "./token-helpers";
import { User, UserDocument } from "../models/user.model";
import { asyncHandler } from "./AsyncHandler";

export const isAuthenticated = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    // check if token exists
    if (!token) {
      throw new ApiError("Unauthenticated Request", 401);
    }

    // verify the token
    const validToken = verifyToken(token);
    if (!validToken._id) {
      throw new ApiError("Invalid Request", 401);
    }

    // check if user exists for this token id
    const user = await User.findById(validToken._id);
    if (!user) {
      throw new ApiError("Invalid Request", 401);
    }

    req.user = user;

    next();
  }
);
