import express from "express";
import { isAuthenticated } from "../utils/middleware";
import {
  createStudent,
  deleteStudent,
  downloadStudentData,
  fetchAllStudents,
  fetchStudent,
  fetchStudentContestHistory,
  fetchStudentSubmissionData,
  updateStudent,
  updateStudentEmail,
} from "../controllers/student.controller";

const router = express.Router();

router.get("/", isAuthenticated, fetchAllStudents);
router.post("/", isAuthenticated, createStudent);
router.get("/:id", isAuthenticated, fetchStudent);
router.get("/:id/contest-history", isAuthenticated, fetchStudentContestHistory);
router.get("/:id/submission-data", isAuthenticated, fetchStudentSubmissionData);
router.patch("/:id/email", isAuthenticated, updateStudentEmail);
router.patch("/:id", isAuthenticated, updateStudent);
router.delete("/:id", isAuthenticated, deleteStudent);
router.get("/download", isAuthenticated, downloadStudentData);

export { router as studentRouter };
