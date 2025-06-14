import { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";
import { verifyToken } from "./token-helpers";
import { User, UserDocument } from "../models/user.model";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("dwefwef");
    const token = req.cookies.token;

    console.log({ token });

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
    //@ts-ignore
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
