import express, { NextFunction, Request, Response } from "express";
import { ApiError } from "./utils/ApiError";
import { connectDB } from "./utils/db";
import { userRouter } from "./routes/user.route";
import cookieParser from "cookie-parser";
import cors from "cors";
import { studentRouter } from "./routes/student.route";

import { config } from "dotenv";
config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/student", studentRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const { message = "Internal Server Error" } = err;

  let status = 500;
  if (err instanceof ApiError) {
    ({ status } = err);
  }

  res.status(status).send({ message, success: false });
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("Connected to DB");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to DB.\nExiting...");
    process.exit(1);
  });
