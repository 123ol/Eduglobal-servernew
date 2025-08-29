import Course from "../models/Course.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// Create course
const createCourse = asyncHandler(async (req, res) => {
  const { 
    title, 
    shortDescription, 
    category, 
    level, 
    language, 
    featured, 
    courseTime, 
    totalLecture, 
    price, 
    discountPrice, 
    discountEnabled, 
    description, 
    courseImage, 
    videoFiles, 
    videoURL 
  } = req.body;

  // Log incoming request body for debugging
  console.log('Create course request body:', JSON.stringify(req.body, null, 2));

  // Validate required fields
  if (!title || !category) {
    res.status(400);
    throw new Error('Title and category are required');
  }

  const course = new Course({
    title,
    shortDescription,
    category,
    level: level || 'All Level',
    language,
    featured: featured === "true" || false,
    courseTime,
    totalLecture,
    price: price ? Number(price) : 0,
    discountPrice: discountEnabled === "true" ? Number(discountPrice) : null,
    discountEnabled: discountEnabled === "true" || false,
    description,
    instructor: req.user._id,
    courseImage: courseImage || '', // Ensure string, even if empty
    videoFiles: videoFiles ? {
      mp4: videoFiles.mp4 || '',
      webm: videoFiles.webm || '',
      ogg: videoFiles.ogg || '',
    } : { mp4: '', webm: '', ogg: '' },
    videoURL: videoURL || '',
    pricingModel: price > 0 ? 'paid' : 'free',
    status: 'Pending',
  });

  const createdCourse = await course.save();
  console.log('Created course:', JSON.stringify(createdCourse, null, 2));
  res.status(201).json(createdCourse);
});

// Get all courses with pagination, filtering, and sorting
const getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, level, sort = "createdAt", order = "desc" } = req.query;
  
  const query = {};
  if (category) query.category = category;
  if (level) query.level = level;

  const courses = await Course.find(query)
    .populate("instructor", "name email")
    .sort({ [sort]: order === "desc" ? -1 : 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Course.countDocuments(query);
  
  res.json({
    courses,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    totalCourses: total,
  });
});

// Get all courses for current user (student)
const getUserCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ enrolledStudents: req.user._id })
    .populate("instructor", "name email");
  res.json(courses);
});

// Update course
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this course");
  }

  const updatedData = {
    title: req.body.title || course.title,
    shortDescription: req.body.shortDescription || course.shortDescription,
    category: req.body.category || course.category,
    level: req.body.level || course.level,
    language: req.body.language || course.language,
    featured: req.body.featured ? req.body.featured === "true" : course.featured,
    courseTime: req.body.courseTime || course.courseTime,
    totalLecture: req.body.totalLecture || course.totalLecture,
    price: req.body.price ? Number(req.body.price) : course.price,
    discountPrice: req.body.discountEnabled === "true" ? Number(req.body.discountPrice) : null,
    discountEnabled: req.body.discountEnabled === "true" || course.discountEnabled,
    description: req.body.description || course.description,
    courseImage: req.body.courseImage || course.courseImage,
    videoFiles: req.body.videoFiles ? {
      mp4: req.body.videoFiles.mp4 || course.videoFiles.mp4,
      webm: req.body.videoFiles.webm || course.videoFiles.webm,
      ogg: req.body.videoFiles.ogg || course.videoFiles.ogg,
    } : course.videoFiles,
    videoURL: req.body.videoURL || course.videoURL,
    pricingModel: req.body.price > 0 ? 'paid' : 'free',
  };

  const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updatedData, { new: true });
  res.json(updatedCourse);
});

// Delete course
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this course");
  }

  await Course.deleteOne({ _id: req.params.id });
  res.json({ message: "Course deleted successfully" });
});

// Enroll in course
const enrollCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.enrolledStudents.includes(req.user._id)) {
    res.status(400);
    throw new Error("Already enrolled in this course");
  }

  course.enrolledStudents.push(req.user._id);
  await course.save();

  await User.findByIdAndUpdate(req.user._id, {
    $push: { enrolledCourses: course._id },
  });

  res.json({ message: "Successfully enrolled in course" });
});

// Get single course details with public ratings
const getCourseDetails = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "name email")
    .populate("enrolledStudents", "name email")
    .populate("ratings.user", "name");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json({
    ...course.toObject(),
    ratings: course.ratings.map(rating => ({
      rating: rating.rating,
      comment: rating.comment,
      user: rating.user.name,
      createdAt: rating.createdAt,
    })),
  });
});

// Get all students enrolled in a course
const getEnrolledStudents = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("enrolledStudents", "name email");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view enrolled students");
  }

  res.json(course.enrolledStudents);
});

// Rate a course
const rateCourse = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!course.enrolledStudents.includes(req.user._id)) {
    res.status(403);
    throw new Error("Must be enrolled to rate this course");
  }

  const existingRating = course.ratings.find(
    r => r.user.toString() === req.user._id.toString()
  );

  if (existingRating) {
    existingRating.rating = rating;
    existingRating.comment = comment;
  } else {
    course.ratings.push({
      user: req.user._id,
      rating,
      comment,
    });
  }

  // Calculate average rating
  const totalRatings = course.ratings.reduce((sum, r) => sum + r.rating, 0);
  course.averageRating = totalRatings / course.ratings.length || 0;

  await course.save();
  res.json({ message: "Course rated successfully", averageRating: course.averageRating });
});

export {
  createCourse,
  getAllCourses,
  getUserCourses,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseDetails,
  getEnrolledStudents,
  rateCourse,
};
