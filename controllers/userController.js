
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

// @desc    Get total number of enrolled students and their details
// @route   GET /api/users/enrolled
// @access  Private/Admin
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const totalEnrolledStudents = await User.countDocuments({
    role: 'student',
    enrolledCourses: { $ne: [] },
  });

  const students = await User.find({
    role: 'student',
    enrolledCourses: { $ne: [] },
  })
    .select('name email enrolledCourses')
    .lean();

  const studentDetails = await Promise.all(
    students.map(async (student) => {
      const enrollmentCount = await Enrollment.countDocuments({ user: student._id });
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        enrolledCoursesCount: enrollmentCount,
      };
    })
  );

  res.status(200).json({
    totalEnrolledStudents,
    studentDetails,
  });
});

// @desc    Get total number of all students (enrolled or not) and their details
// @route   GET /api/users/total
// @access  Private/Admin
const getTotalStudents = asyncHandler(async (req, res) => {
  const { search } = req.query;

  // Build query
  const query = { role: 'student' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Count students
  const totalStudents = await User.countDocuments(query);

  // Fetch student data
  const students = await User.find(query)
    .select('name email enrolledCourses')
    .lean();

  // Calculate enrolled courses count
  const studentDetails = await Promise.all(
    students.map(async (student) => {
      const enrollmentCount = await Enrollment.countDocuments({ user: student._id });
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        enrolledCoursesCount: enrollmentCount,
      };
    })
  );

  res.status(200).json({
    totalStudents,
    studentDetails,
  });
});

// @desc    Delete a student and their enrollments
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
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
  await User.findByIdAndDelete(id);

  res.status(200).json({
    message: 'Student deleted successfully',
    id,
  });
});

export { getEnrolledStudents, getTotalStudents, deleteStudent };
