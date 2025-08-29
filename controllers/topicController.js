import asyncHandler from 'express-async-handler';
import Topic from '../models/Topic.js';
import Lecture from '../models/Lecture.js';
import UserProgress from '../models/UserProgress.js';

// @desc    Create a new topic for a lecture
// @route   POST /api/lectures/:lectureId/topics
// @access  Private/Admin
const createTopic = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const { name, description, resourceType, resourceLink } = req.body;

  if (!name || !resourceType || !resourceLink) {
    res.status(400);
    throw new Error('Topic name, resource type, and resource link are required');
  }

  if (!['video', 'pdf'].includes(resourceType)) {
    res.status(400);
    throw new Error('Resource type must be "video" or "pdf"');
  }

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  const topic = await Topic.create({
    lecture: lectureId,
    name,
    description: description || '',
    resourceType,
    resourceLink,
  });

  lecture.topics.push(topic._id);
  await lecture.save();

  res.status(201).json({
    _id: topic._id,
    lecture: topic.lecture,
    name: topic.name,
    description: topic.description,
    resourceType: topic.resourceType,
    resourceLink: topic.resourceLink,
    completed: false,
  });
});

// @desc    Get all topics for a lecture with completion status
// @route   GET /api/lectures/:lectureId/topics
// @access  Private
const getTopicsByLecture = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;
  const userId = req.user?._id; // From auth middleware

  if (!userId) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  const topics = await Topic.find({ lecture: lectureId });
  const topicProgress = await UserProgress.find({ userId, lectureId });

  const enrichedTopics = topics.map((topic) => ({
    _id: topic._id,
    lecture: topic.lecture,
    name: topic.name,
    description: topic.description,
    resourceType: topic.resourceType,
    resourceLink: topic.resourceLink,
    completed: topicProgress.some(
      (p) => p.topicId.toString() === topic._id.toString() && p.completed
    ),
  }));

  console.log(`Topics for lecture ${lectureId}:`, JSON.stringify(enrichedTopics, null, 2));
  res.status(200).json(enrichedTopics);
});

// @desc    Mark a topic as completed and update lecture completion
// @route   POST /api/lectures/:lectureId/topics/:topicId/complete
// @access  Private
const completeTopic = asyncHandler(async (req, res) => {
  const { lectureId, topicId } = req.params;
  const userId = req.user?._id; // From auth middleware

  if (!userId) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  // Validate lecture
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  // Validate topic and association
  const topic = await Topic.findById(topicId);
  if (!topic || topic.lecture.toString() !== lectureId) {
    res.status(404);
    throw new Error('Topic not found or not associated with lecture');
  }

  // Update or create user progress
  const progress = await UserProgress.findOneAndUpdate(
    { userId, topicId, lectureId },
    { completed: true, completedAt: new Date() },
    { upsert: true, new: true }
  );

  // Check if all topics are completed
  const topicProgress = await UserProgress.find({ userId, lectureId });
  const allTopicsCompleted = lecture.topics.every((tId) =>
    topicProgress.some((p) => p.topicId.toString() === tId.toString() && p.completed)
  );

  // Update lecture completion status
  lecture.completed = allTopicsCompleted;
  await lecture.save();

  res.status(200).json({
    message: 'Topic marked as completed',
    topic: {
      _id: topic._id,
      lecture: topic.lecture,
      name: topic.name,
      description: topic.description,
      resourceType: topic.resourceType,
      resourceLink: topic.resourceLink,
      completed: true,
    },
    lecture: {
      _id: lecture._id,
      title: lecture.title,
      completed: lecture.completed,
    },
  });
});

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, resourceType, resourceLink } = req.body;

  if (!name || !resourceType || !resourceLink) {
    res.status(400);
    throw new Error('Topic name, resource type, and resource link are required');
  }

  if (!['video', 'pdf'].includes(resourceType)) {
    res.status(400);
    throw new Error('Resource type must be "video" or "pdf"');
  }

  const topic = await Topic.findById(id);
  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }

  topic.name = name;
  topic.description = description || '';
  topic.resourceType = resourceType;
  topic.resourceLink = resourceLink;

  const updatedTopic = await topic.save();
  res.status(200).json({
    _id: updatedTopic._id,
    lecture: updatedTopic.lecture,
    name: updatedTopic.name,
    description: updatedTopic.description,
    resourceType: updatedTopic.resourceType,
    resourceLink: updatedTopic.resourceLink,
    completed: false, // Assume updates don't affect completion
  });
});

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id);
  if (!topic) {
    res.status(404);
    throw new Error('Topic not found');
  }

  const lecture = await Lecture.findById(topic.lecture);
  if (lecture) {
    lecture.topics = lecture.topics.filter((topicId) => topicId.toString() !== id);
    // Recalculate lecture completion status
    const topicProgress = await UserProgress.find({ userId: req.user?._id, lectureId: topic.lecture });
    lecture.completed = lecture.topics.length > 0 && lecture.topics.every((tId) =>
      topicProgress.some((p) => p.topicId.toString() === tId.toString() && p.completed)
    );
    await lecture.save();
  }

  await Topic.deleteOne({ _id: id });
  await UserProgress.deleteMany({ topicId: id }); // Clean up progress records
  res.status(200).json({ message: 'Topic deleted successfully' });
});

export { createTopic, getTopicsByLecture, completeTopic, updateTopic, deleteTopic };