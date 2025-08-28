
import express from 'express';
import { createLecture, getLecturesByCourse, updateLecture, deleteLecture } from '../controllers/lectureController.js';
import { protect} from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/courses/:courseId/lectures')
  .post(protect, createLecture)
  .get(getLecturesByCourse);

router.route('/lectures/:id')
  .put(protect,  updateLecture)
  .delete(protect,  deleteLecture);

export default router;