
import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';
import Course from '../models/Course.js';

// @desc    Get all categories with course count
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: 'category',
        as: 'courses',
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        courseCount: { $size: '$courses' },
        courseNames: {
          $map: {
            input: '$courses',
            as: 'course',
            in: '$$course.title',
          },
        },
      },
    },
  ]);


  res.status(200).json(categories);
});


const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category already exists');
  }

  const category = await Category.create({ name });
  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Category name is required');
  }

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const categoryExists = await Category.findOne({ name, _id: { $ne: id } });
  if (categoryExists) {
    res.status(400);
    throw new Error('Category name already exists');
  }

  category.name = name;
  const updatedCategory = await category.save();
  res.status(200).json(updatedCategory);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  // Check if category is used by any course
  const course = await Course.findOne({ category: id });
  if (course) {
    res.status(400);
    throw new Error('Cannot delete category used by a course');
  }

  await category.deleteOne();
  res.status(200).json({ message: 'Category deleted successfully' });
});

export { getCategories, createCategory, updateCategory, deleteCategory };