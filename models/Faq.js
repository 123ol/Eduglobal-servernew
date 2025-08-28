import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Faq", faqSchema);
