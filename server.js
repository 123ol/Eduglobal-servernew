import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import categoryRoutes from './routes/categoryRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import userRoutes from './routes/userRoutes.js'
import axios from "axios";
// Load environment variables
dotenv.config();

// Connect to DB
connectDB();

const app = express();
const PAYSTACK_SECRET_KEY = 'sk_test_your_paystack_secret_key';
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
  res.send("LMS Backend API is running 🚀");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', lectureRoutes);
app.use('/api', topicRoutes);
app.use('/api', userRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});
// Verify payment endpoint
app.post('/api/payments/verify', async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ success: false, message: 'Reference is required.' });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer sk_test_cb35b2feb06c965ed71f9b36ab23d1e9110ded1c`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentData = response.data;

    if (paymentData.status && paymentData.data.status === 'success') {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: paymentData.data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});