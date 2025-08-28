import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getEnrolledStudents, getTotalStudents, deleteStudent } from '../controllers/userController.js';

const router = express.Router();

// Get total enrolled students
router.get('/enrolled', protect, getEnrolledStudents);

// Get total students (enrolled or not)
router.get('/total', protect, getTotalStudents);

// Delete a student by ID
router.delete('/:id', protect, deleteStudent);

export default router;