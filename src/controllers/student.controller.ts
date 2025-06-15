import { syncStudentData } from "../cron";
import { Student } from "../models/student.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";

export const fetchAllStudents = asyncHandler(async (req, res) => {
  const page = parseInt((req.query.page || "1") as string);
  const limit = parseInt((req.query.limit || "10") as string);

  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find().skip(skip).limit(limit),
    Student.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: students,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, cf_handle } = req.body;

  if (!cf_handle) {
    throw new ApiError("CF Handle is required", 400);
  }
  const payload = {
    cf_handle,
    ...(name && { name }),
    ...(email && { email }),
    ...(phone && { phone }),
  };

  const student = new Student(payload);
  await student.save();

  // sync current student
  await syncStudentData(student);

  const updated_student = await Student.findById(student._id);

  res.status(201).json({ success: true, data: updated_student });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, cf_handle, phone } = req.body;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }

  if (!cf_handle) {
    throw new ApiError("CF Handle is required", 400);
  }

  // Only update fields if they are provided
  if (name !== undefined) {
    student.name = name;
  }
  if (email !== undefined) {
    student.email = email;
  }
  if (phone !== undefined) {
    student.phone = phone;
  }

  const old_cf_handle = student.cf_handle;
  student.cf_handle = cf_handle;

  await student.save();

  // TODO: Instead of syncing here, we can push it into a queue and sync it asynchronously
  if (old_cf_handle !== cf_handle) {
    await syncStudentData(student);
  }

  res.status(200).json({ success: true, data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError("Student not found", 404);
  }

  await Student.findByIdAndDelete(id);
  res
    .status(200)
    .json({ success: true, message: "Student deleted successfully" });
});
