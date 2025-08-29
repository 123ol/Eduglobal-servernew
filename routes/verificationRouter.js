import { sendVerificationEmail, verifyEmail, resendVerificationEmail } from "../controllers/verifyController.js";
import express from "express";

const router = express.Router();
router.post("/verify-email", sendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export default router;