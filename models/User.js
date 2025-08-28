import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, sparse: true },
  password: { type: String, required: true, select: false }, // select false by default
  role: { type: String, enum: ["student", "admin"], default: "student" },
  isLoggedIn: { type: Boolean, default: false },
  token: { type: String },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" }],
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

// Hash password only if modified
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password for login
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
