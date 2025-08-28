// controllers/authController.js
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js"; // utility for sending email

// =========================
// Register User
// =========================
export const registerUser = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    // Create user with plain password (pre-save hook will hash)
    const user = await User.create({
      name,
      email,
      phoneNumber,
      password,
      role: "student",
      isLoggedIn: true
    });

    // Generate token
    const token = generateToken(user._id);
    user.token = token;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isLoggedIn: user.isLoggedIn,
      token: user.token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =========================
// Login User
// =========================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Select password explicitly because schema sets select:false
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate token
    const token = generateToken(user._id);
    user.token = token;
    user.isLoggedIn = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isLoggedIn: user.isLoggedIn,
      token: user.token
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const logoutUser = async (req, res) => {
  try {
    const userId = req.user._id; // 👈 user id comes from auth middleware (decoded token)

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear token and update login status
    user.isLoggedIn = false;
    user.token = null;
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =========================
// Forgot Password
// =========================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;
    await sendEmail({ to: user.email, subject: "Password Reset", text: message });

    res.json({ message: "Email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// Reset Password
// =========================
export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password before saving (only if you don’t already do this in your User model pre-save)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // (Optional) Generate a JWT so user is logged in automatically
    // const token = generateToken(user._id);

    res.json({
      message: "Password reset successful",
      // token, // uncomment if you want auto-login after reset
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
