import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["Enrolled", "Completed"], default: "Enrolled" },
  notifyAdmin: { type: Boolean, default: false }, // Student notifies admin on completion
  certificateIssued: { type: Boolean, default: false }, // Admin grants certificate
  enrolledAt: { type: Date, default: Date.now },
  progress: { completedLectures: Number, completedTopics: Number },
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Enrollment", enrollmentSchema);
