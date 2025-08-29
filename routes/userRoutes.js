import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getEnrolledStudents, getTotalStudents, deleteStudent } from '../controllers/userController.js';

const router = express.Router();
router.get('/api/students/enrolled', protect, getEnrolledStudents);
router.get('/api/students', protect, getTotalStudents);
router.delete('/api/students/:id', protect, deleteStudent);