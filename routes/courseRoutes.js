import express from "express";
import {
  createCourse,
  getAllCourses,
  getUserCourses,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseDetails,
  getEnrolledStudents,
  rateCourse,
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js"; // Authentication middleware

const router = express.Router();

// Public routes
router.get("/", getAllCourses); // Get all courses with pagination, filtering, and sorting
router.get("/:id", getCourseDetails); // Get details of a single course (includes public ratings)

// Protected routes (require authentication)
router.post("/", protect, createCourse); // Create a new course
router.get("/user/courses",  getUserCourses); // Get all courses for the current user (student)
router.put("/:id", protect, updateCourse); // Update a course
router.delete("/:id", protect, deleteCourse); // Delete a course
router.post("/:id/enroll", enrollCourse); // Enroll in a course
router.get("/:id/students", protect, getEnrolledStudents); // Get all students enrolled in a course
router.post("/:id/rate", protect, rateCourse); // Rate a course (enrolled students only)

export default router;

