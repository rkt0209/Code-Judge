const asyncHandler = require("../../middlewares/asyncHandler");
const Contest = require("../../models/Contest");
const Question = require("../../models/Question");
const Admin = require("../../models/Admin");
const ErrorResponse = require("../../utils/ErrorResponse");

// Create a new contest
exports.createContest = asyncHandler(async (req, res, next) => {
  const { title, description, start_time, end_time, duration, question_ids } = req.body;

  // Validate required fields
  if (!title || !start_time || !end_time || !duration) {
    throw new ErrorResponse("Title, start time, end time, and duration are required", 400);
  }

  // Validate that end_time is after start_time
  if (new Date(end_time) <= new Date(start_time)) {
    throw new ErrorResponse("End time must be after start time", 400);
  }

  // Create questions array
  const questions = [];
  if (question_ids && question_ids.length > 0) {
    const questionIdArray = Array.isArray(question_ids) ? question_ids : question_ids.split(",");
    
    for (const qid of questionIdArray) {
      const question = await Question.findById(qid.trim());
      if (question) {
        questions.push({ question_id: question._id });
        
        // Add contest name as a tag to the question
        if (!question.tags.includes(title)) {
          question.tags.push(title);
          await question.save();
        }
      }
    }
  }

  // Create contest
  const contest = await Contest.create({
    title,
    description: description || "",
    start_time,
    end_time,
    duration,
    questions,
    participants: [],
  });

  // Update admin's contests_created
  if (req.auth_user && req.auth_user.static_id) {
    await Admin.findByIdAndUpdate(req.auth_user.static_id, {
      $push: { contests_created: { contest_id: contest._id } }
    });
  }

  res.status(201).json({
    success: true,
    message: "Contest created successfully",
    data: contest
  });
});

// Add questions to existing contest
exports.addQuestionsToContest = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;
  const { question_ids } = req.body;

  if (!question_ids || question_ids.length === 0) {
    throw new ErrorResponse("Please provide question IDs to add", 400);
  }

  const contest = await Contest.findById(contest_id);
  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  const questionIdArray = Array.isArray(question_ids) ? question_ids : question_ids.split(",");
  const existingQuestionIds = contest.questions.map(q => q.question_id.toString());

  for (const qid of questionIdArray) {
    const trimmedId = qid.trim();
    if (existingQuestionIds.includes(trimmedId)) {
      continue; // Skip if already added
    }

    const question = await Question.findById(trimmedId);
    if (question) {
      contest.questions.push({ question_id: question._id });
      
      // Add contest name as a tag
      if (!question.tags.includes(contest.title)) {
        question.tags.push(contest.title);
        await question.save();
      }
    }
  }

  await contest.save();

  res.status(200).json({
    success: true,
    message: "Questions added to contest",
    data: contest
  });
});

// Get all contests (admin view with all details)
exports.getAllContests = asyncHandler(async (req, res, next) => {
  const contests = await Contest.find()
    .populate('questions.question_id', 'title difficulty tags')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: contests.length,
    data: contests
  });
});

// Get contest by ID
exports.getContestById = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;

  const contest = await Contest.findById(contest_id)
    .populate('questions.question_id', 'title difficulty tags time_limit')
    .populate('participants.user_id', 'name handle email');

  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  res.status(200).json({
    success: true,
    data: contest
  });
});

// Update contest details
exports.updateContest = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;
  const { title, description, start_time, end_time, duration } = req.body;

  const contest = await Contest.findById(contest_id);
  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  // Check if contest has already started
  const now = new Date();
  const contestStartTime = new Date(contest.start_time);
  
  if (now >= contestStartTime) {
    throw new ErrorResponse("Cannot edit contest after it has started", 400);
  }

  // Update fields if provided
  if (title) contest.title = title;
  if (description !== undefined) contest.description = description;
  if (start_time) contest.start_time = start_time;
  if (end_time) contest.end_time = end_time;
  if (duration) contest.duration = duration;

  // Validate times if updated
  if (new Date(contest.end_time) <= new Date(contest.start_time)) {
    throw new ErrorResponse("End time must be after start time", 400);
  }

  await contest.save();

  res.status(200).json({
    success: true,
    message: "Contest updated successfully",
    data: contest
  });
});

// Delete contest
exports.deleteContest = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;

  const contest = await Contest.findById(contest_id);
  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  // Remove contest tag from all questions
  for (const q of contest.questions) {
    const question = await Question.findById(q.question_id);
    if (question) {
      question.tags = question.tags.filter(tag => tag !== contest.title);
      await question.save();
    }
  }

  await Contest.findByIdAndDelete(contest_id);

  res.status(200).json({
    success: true,
    message: "Contest deleted successfully"
  });
});
