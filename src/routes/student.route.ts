import express from "express";
import { isAuthenticated } from "../utils/middleware";
import {
  createStudent,
  deleteStudent,
  fetchAllStudents,
  fetchStudentContestHistory,
  updateStudent,
} from "../controllers/student.controller";

const router = express.Router();

router.get("/", isAuthenticated, fetchAllStudents);
router.post("/", isAuthenticated, createStudent);
router.get("/:id/contest-history", isAuthenticated, fetchStudentContestHistory);
router.patch("/:id", isAuthenticated, updateStudent);
router.delete("/:id", isAuthenticated, deleteStudent);

export { router as studentRouter };
