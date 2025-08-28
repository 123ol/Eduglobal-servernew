
import asyncHandler from 'express-async-handler';
import Lecture from '../models/Lecture.js';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';

// @desc    Create a new lecture for a course
// @route   POST /api/courses/:courseId/lectures
// @access  Private/Admin
const createLecture = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Lecture title is required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const lecture = await Lecture.create({
    course: courseId,
    title,
    topics: [],
  });

  res.status(201).json({
    _id: lecture._id,
    course: lecture.course,
    title: lecture.title,
    topics: lecture.topics,
  });
});

// @desc    Get all lectures for a course
// @route   GET /api/courses/:courseId/lectures
// @access  Public
const getLecturesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const lectures = await Lecture.find({ course: courseId }).populate('topics', 'name resourceType resourceLink');
  console.log(`Lectures for course ${courseId}:`, JSON.stringify(lectures, null, 2));
  res.status(200).json(lectures);
});

// @desc    Update a lecture
// @route   PUT /api/lectures/:id
// @access  Private/Admin
const updateLecture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Lecture title is required');
  }

  const lecture = await Lecture.findById(id);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  lecture.title = title;
  const updatedLecture = await lecture.save();
  res.status(200).json({
    _id: updatedLecture._id,
    course: updatedLecture.course,
    title: updatedLecture.title,
    topics: updatedLecture.topics,
  });
});

// @desc    Delete a lecture
// @route   DELETE /api/lectures/:id
// @access  Private/Admin
const deleteLecture = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lecture = await Lecture.findById(id);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  const topicCount = await Topic.countDocuments({ lecture: id });
  if (topicCount > 0) {
    res.status(400);
    throw new Error('Cannot delete lecture with associated topics');
  }

  await Lecture.deleteOne({ _id: id });
  res.status(200).json({ message: 'Lecture deleted successfully' });
});

export { createLecture, getLecturesByCourse, updateLecture, deleteLecture };