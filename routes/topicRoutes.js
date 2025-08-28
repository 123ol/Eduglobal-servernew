import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createTopic, getTopicsByLecture, updateTopic, deleteTopic } from "../controllers/topicController.js";

const router = express.Router({ mergeParams: true });

// POST /api/lectures/:lectureId/topics
// GET /api/lectures/:lectureId/topics
router.route("/lectures/:lectureId/topics")
  .post(protect, createTopic)
  .get(getTopicsByLecture);

// PUT /api/topics/:id
// DELETE /api/topics/:id
router.route("/topics/:id")
  .put(protect, updateTopic)
  .delete(protect, deleteTopic);

export default router;
