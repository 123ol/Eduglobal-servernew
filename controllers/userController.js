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

  const { search } = req.query;
  const query = { role: 'student' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await User.find(query)
    .select('_id name email location createdAt avatar')
    .lean();
  console.log(`getEnrolledStudents: Found ${students.length} students`);

  const studentDetails = await Promise.all(
    students.map(async (student) => {
      const enrollments = await Enrollment.find({ user: student._id })
        .populate({
          path: 'course',
          select: 'title lectures',
          populate: { path: 'lectures', select: 'title' },
        })
        .lean();
      const courses = enrollments.map((e) => e.course).filter(Boolean);
      console.log(
        `Student ${student._id}: Enrollments=${enrollments.length}, Courses=${courses.map((c) => c.title).join(', ')}`
      );

      let totalTopics = 0;
      let completedTopics = 0;

      for (const course of courses) {
        const lectures = course.lectures || [];
        console.log(`Course ${course._id} (${course.title}): Lectures=${lectures.length}`);
        for (const lecture of lectures) {
          const topics = await Topic.find({ lecture: lecture._id }).lean();
          totalTopics += topics.length;
          console.log(`Lecture ${lecture._id} (${lecture.title}): Topics=${topics.length}`);

          const progress = await UserProgress.find({
            userId: student._id,
            lectureId: lecture._id,
            topicId: { $in: topics.map((t) => t._id) },
          }).lean();
          const completed = progress.filter((p) => p.completed);
          completedTopics += completed.length;
          console.log(`Lecture ${lecture._id}: TotalProgressRecords=${progress.length}, Completed=${completed.length}`);
          if (progress.length > 0) {
            console.log(
              `Student ${student._id}, Lecture ${lecture._id}: ProgressRecords=`,
              progress.map((p) => ({ topicId: p.topicId, completed: p.completed }))
            );
          }
        }
      }

      console.log(`Student ${student._id}: TotalTopics=${totalTopics}, CompletedTopics=${completedTopics}`);

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

  const enrolledStudentDetails = studentDetails.filter((s) => s.totalCourses > 0);
  console.log(`getEnrolledStudents: Enrolled students=${enrolledStudentDetails.length}`);

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
  const query = { role: 'student' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await User.find(query)
    .select('_id name email location createdAt avatar')
    .lean();
  console.log(`getTotalStudents: Found ${students.length} students`);

  const studentDetails = await Promise.all(
    students.map(async (student) => {
      const enrollments = await Enrollment.find({ user: student._id })
        .populate({
          path: 'course',
          select: 'title lectures',
          populate: { path: 'lectures', select: 'title' },
        })
        .lean();
      const courses = enrollments.map((e) => e.course).filter(Boolean);
      console.log(
        `Student ${student._id}: Enrollments=${enrollments.length}, Courses=${courses.map((c) => c.title).join(', ')}`
      );

      let totalTopics = 0;
      let completedTopics = 0;

      for (const course of courses) {
        const lectures = course.lectures || [];
        console.log(`Course ${course._id} (${course.title}): Lectures=${lectures.length}`);
        for (const lecture of lectures) {
          const topics = await Topic.find({ lecture: lecture._id }).lean();
          totalTopics += topics.length;
          console.log(`Lecture ${lecture._id} (${lecture.title}): Topics=${topics.length}`);

          const progress = await UserProgress.find({
            userId: student._id,
            lectureId: lecture._id,
            topicId: { $in: topics.map((t) => t._id) },
          }).lean();
          const completed = progress.filter((p) => p.completed);
          completedTopics += completed.length;
          console.log(`Lecture ${lecture._id}: TotalProgressRecords=${progress.length}, Completed=${completed.length}`);
          if (progress.length > 0) {
            console.log(
              `Student ${student._id}, Lecture ${lecture._id}: ProgressRecords=`,
              progress.map((p) => ({ topicId: p.topicId, completed: p.completed }))
            );
          }
        }
      }

      console.log(`Student ${student._id}: TotalTopics=${totalTopics}, CompletedTopics=${completedTopics}`);

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

// @desc    Enroll a student in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollStudent = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.user.id; // From protect middleware

  const user = await User.findById(userId);
  if (!user || user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can enroll');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
  if (existingEnrollment) {
    res.status(400);
    throw new Error('Student already enrolled in this course');
  }

  const enrollment = await Enrollment.create({ user: userId, course: courseId });
  console.log(`Student ${userId} enrolled in course ${courseId}`);

  // Initialize UserProgress for all topics in the course
  const lectures = await Lecture.find({ course: courseId });
  for (const lecture of lectures) {
    const topics = await Topic.find({ lecture: lecture._id });
    for (const topic of topics) {
      await UserProgress.create({
        userId,
        lectureId: lecture._id,
        topicId: topic._id,
        completed: false,
      });
    }
  }

  res.status(201).json({
    message: 'Enrolled successfully',
    enrollment: { user: userId, course: courseId },
  });
});

export { getEnrolledStudents, getTotalStudents, deleteStudent, enrollStudent };