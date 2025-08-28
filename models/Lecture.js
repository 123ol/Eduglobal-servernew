import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true },
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }]
}, { timestamps: true });

export default mongoose.model("Lecture", lectureSchema);
