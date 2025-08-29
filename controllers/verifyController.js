import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// =========================
// Send Verification Email
// =========================
export const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerify) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send email
    const message = `Please verify your email by clicking the following link: \n\n ${verificationUrl}`;
    await sendEmail({
      to: user.email,
      subject: "Email Verification",
      text: message,
    });

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =========================
// Verify Email
// =========================
export const verifyEmail = async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Mark email as verified
    user.isVerify = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =========================
// Resend Verification Email
// =========================
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerify) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send email
    const message = `Please verify your email by clicking the following link: \n\n ${verificationUrl}`;
    await sendEmail({
      to: user.email,
      subject: "Email Verification",
      text: message,
    });

    res.status(200).json({ message: "Verification email resent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};