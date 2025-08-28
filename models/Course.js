import mongoose from "mongoose";

// Define FAQ schema (since you referenced faqSchema)
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: { type: String },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  level: { type: String, enum: ['All Level', 'Beginner', 'Intermediate', 'Advance'], default: 'All Level' },
  language: { type: String },
  featured: { type: Boolean, default: false },
  courseTime: { type: String },
  totalLecture: { type: String },
  price: { type: Number, default: 0 },
  discountPrice: { type: Number },
  discountEnabled: { type: Boolean, default: false },
  courseImage: { type: String }, // Cloudinary URL
  videoFiles: {
    mp4: { type: String },
    webm: { type: String },
    ogg: { type: String },
  },
  videoURL: { type: String }, // External video URL (e.g., YouTube)
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratings: [ratingSchema],
  averageRating: { type: Number, default: 0 },
  pricingModel: { type: String, enum: ['free', 'paid'], default: 'free' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lecture' }],
  faqs: [{ question: String, answer: String }],
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);