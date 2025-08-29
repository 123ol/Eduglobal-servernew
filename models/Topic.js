import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  lecture: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
  name: { type: String, required: true },
  description: { type: String },
  resourceType: { type: String, enum: ["video", "pdf"], required: true },
  resourceLink: { type: String, required: true }, // video link or pdf link
  completed:{ type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Topic", topicSchema);
