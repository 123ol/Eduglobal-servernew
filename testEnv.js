import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

console.log("Environment variables:", {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? "[HIDDEN]" : "undefined",
  FRONTEND_URL: process.env.FRONTEND_URL,
});