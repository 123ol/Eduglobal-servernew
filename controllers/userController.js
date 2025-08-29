import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Lecture from '../models/Lecture.js';
import Topic from '../models/Topic.js';
import UserProgress from '../models/UserProgress.js';

// @desc    Get total number of enrolled students and their details with progress
// @route   GET /api/students/enrolled
// @access  Private/Admin
const getEnrolledStudents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const students = await User.find({
    role: 'student',
  })
    .select('_id name email location createdAt avatar')
    .lean();

  const studentDetails = await Promise.all(
    students.map(async (student) => {
      // Fetch enrolled courses
      const enrollments = await Enrollment.find({ user: student._id }).populate({
        path: 'course',
        populate: { path: 'lectures' },
      });
      const courses = enrollments.map((e) => e.course).filter(Boolean);

      let totalTopics = 0;
      let completedTopics = 0;

      // Calculate topic-based progress
      for (const course of courses) {
        const lectures = course.lectures || [];
        for (const lecture of lectures) {
          const topics = await Topic.find({ lecture: lecture._id }).lean();
          totalTopics += topics.length;

          const progress = await UserProgress.find({
            userId: student._id,
            lectureId: lecture._id,
            topicId: { $in: topics.map((t) => t._id) },
            completed: true,
          }).lean();
          completedTopics += progress.length;
        }
      }

      return {
        _id: student._id,
        name: student.name || 'Unknown',
        email: student.email || 'Unknown',
        location: student.location || 'Unknown',
        createdAt: student.createdAt || Date.now(),
        avatar: student.avatar || null,
        totalCourses: courses.length,
        progress: totalTopics > 0 ? Math.trunc((completedTopics / totalTopics) * 100) : 0,
      };
    })
  );

  // Filter students with at least one enrolled course
  const enrolledStudentDetails = studentDetails.filter((s) => s.totalCourses > 0);

  res.status(200).json({
    totalEnrolledStudents: enrolledStudentDetails.length,
    studentDetails: enrolledStudentDetails,
  });
});

// @desc    Get total number of all students (enrolled or not) and their details with progress
// @route   GET /api/students
// @access  Private/Admin
const getTotalStudents = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const { search } = req.query;

  // Build query
  const query = { role: 'student' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Fetch students
  const students = await User.find(query)
    .select('_id name email location createdAt avatar')
    .lean();

  const studentDetails = await Promise.all(
    students.map(async (student) => {
      // Fetch enrolled courses
      const enrollments = await Enrollment.find({ user: student._id }).populate({
        path: 'course',
        populate: { path: 'lectures' },
      });
      const courses = enrollments.map((e) => e.course).filter(Boolean);

      let totalTopics = 0;
      let completedTopics = 0;

      // Calculate topic-based progress
      for (const course of courses) {
        const lectures = course.lectures || [];
        for (const lecture of lectures) {
          const topics = await Topic.find({ lecture: lecture._id }).lean();
          totalTopics += topics.length;

          const progress = await UserProgress.find({
            userId: student._id,
            lectureId: lecture._id,
            topicId: { $in: topics.map((t) => t._id) },
            completed: true,
          }).lean();
          completedTopics += progress.length;
        }
      }

      return {
        _id: student._id,
        name: student.name || 'Unknown',
        email: student.email || 'Unknown',
        location: student.location || 'Unknown',
        createdAt: student.createdAt || Date.now(),
        avatar: student.avatar || null,
        totalCourses: courses.length,
        progress: totalTopics > 0 ? Math.trunc((completedTopics / totalTopics) * 100) : 0,
      };
    })
  );

  res.status(200).json({
    totalStudents: students.length,
    studentDetails,
  });
});

// @desc    Delete a student and their enrollments and progress
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (user.role !== 'student') {
    res.status(400);
    throw new Error('User is not a student');
  }

  await Enrollment.deleteMany({ user: id });
  await UserProgress.deleteMany({ userId: id });
  await User.findByIdAndDelete(id);

  res.status(200).json({
    message: 'Student deleted successfully',
    id,
  });
});

export { getEnrolledStudents, getTotalStudents, deleteStudent };