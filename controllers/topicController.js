
import asyncHandler from 'express-async-handler';
import Topic from '../models/Topic.js';
import Lecture from '../models/Lecture.js';

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
  });
});

// @desc    Get all topics for a lecture
// @route   GET /api/lectures/:lectureId/topics
// @access  Public
const getTopicsByLecture = asyncHandler(async (req, res) => {
  const { lectureId } = req.params;

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    res.status(404);
    throw new Error('Lecture not found');
  }

  const topics = await Topic.find({ lecture: lectureId });
  console.log(`Topics for lecture ${lectureId}:`, JSON.stringify(topics, null, 2));
  res.status(200).json(topics);
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
    lecture.topics = lecture.topics.filter(topicId => topicId.toString() !== id);
    await lecture.save();
  }

  await Topic.deleteOne({ _id: id });
  res.status(200).json({ message: 'Topic deleted successfully' });
});

export { createTopic, getTopicsByLecture, updateTopic, deleteTopic };