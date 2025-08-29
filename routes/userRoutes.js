import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getEnrolledStudents, getTotalStudents, deleteStudent, enrollStudent } from '../controllers/userController.js';

const router = express.Router();
router.get('/students/enrolled', protect, getEnrolledStudents);
router.get('/students', protect, getTotalStudents);
router.delete('/students/:id', protect, deleteStudent);
router.post('/courses/:id/enroll', protect, enrollStudent);

export default router;