import express, { NextFunction, Request, Response } from "express";
import { ApiError } from "./utils/ApiError";

const app = express();

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

app.listen(3000, () => {
  console.log("Example app listening on port 3000!");
});
