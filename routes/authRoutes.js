import express from "express";
import { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  logoutUser 
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js"; // 👈 middleware to check token

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// ✅ Logout route (protected)
router.post("/logout", protect, logoutUser);

export default router;
