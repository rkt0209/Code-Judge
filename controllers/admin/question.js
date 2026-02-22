const asyncHandler = require("../../middlewares/asyncHandler");
const Question = require("../../models/Question");
const Admin = require("../../models/Admin");
const ErrorResponse = require("../../utils/ErrorResponse");
const fs = require("fs");
const path = require("path");

exports.createQuestion = asyncHandler(async (req, res, next) => {
  console.log('=== CREATE QUESTION REQUEST ===');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);
  console.log('req.auth_user:', req.auth_user);
  
  // 1. Check if files are uploaded
  if (!req.files || !req.files.input_file || !req.files.solution_file || !req.files.content_file) {
    console.log('Missing files:', {
      hasFiles: !!req.files,
      hasInput: !!(req.files && req.files.input_file),
      hasSolution: !!(req.files && req.files.solution_file),
      hasContent: !!(req.files && req.files.content_file)
    });
    throw new ErrorResponse("Please upload Input, Solution, and Content files", 400);
  }

  const { title, content, tags, time_limit, difficulty } = req.body;

  // 2. Get File Paths (Multer saves them, we just need the path)
  const input_file_path = req.files.input_file[0].path;
  const solution_file_path = req.files.solution_file[0].path;
  const content_file_path = req.files.content_file[0].path;

  // 3. Create Question in DB
  const question = await Question.create({
    title,
    content: content || "",
    content_file: content_file_path,
    tags: tags ? tags.split(",") : [], // Allow comma-separated tags
    time_limit: time_limit || 1, // Default 1 second
    difficulty: difficulty || "medium",
    input_file: input_file_path,     // Path to input.txt
    solution_file: solution_file_path // Path to solution.txt
  });

  if (req.auth_user && req.auth_user.static_id) {
    await Admin.findByIdAndUpdate(req.auth_user.static_id, {
      $push: { questions_created: { question_id: question._id } }
    });
  }

  res.status(201).json({
    success: true,
    message: "Question Created Successfully",
    data: question
  });
});