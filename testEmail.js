// backend/testEmail.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // Adjust path if needed

import sendEmail from "./utils/sendEmail.js";

const testEmail = async () => {
  try {
    console.log("Environment variables:", {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? "[HIDDEN]" : "undefined",
    });
    await sendEmail({
      to: "amlia251999@gmail.com",
      subject: "Test Email",
      text: "This is a test email from EduGlobal.",
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error; // Ensure the error is propagated to see the full stack trace
  }
};

testEmail().catch((err) => {
  console.error("Test email failed:", err);
  process.exit(1); // Exit with error code for clarity
});