const asyncHandler = require("../../middlewares/asyncHandler");
const Contest = require("../../models/Contest");
const Question = require("../../models/Question");
const Submission = require("../../models/Submission");
const User = require("../../models/User");
const ErrorResponse = require("../../utils/ErrorResponse");
const fs = require("fs");
const Queue = require("bull");

// Connect to Queue
const submissionQueue = new Queue("submissions", {
    redis: { port: process.env.REDIS_PORT || 6379, host: process.env.REDIS_HOST || '127.0.0.1' },
});

// Get all contests (user view - only basic info)
exports.getAllContests = asyncHandler(async (req, res, next) => {
  const contests = await Contest.find()
    .populate('questions.question_id', 'title difficulty')
    .select('-participants')
    .sort({ start_time: -1 });

  const now = new Date();
  const contestsWithStatus = contests.map(contest => ({
    ...contest.toObject(),
    status: now < new Date(contest.start_time) ? 'upcoming' 
            : now > new Date(contest.end_time) ? 'ended' 
            : 'active'
  }));

  res.status(200).json({
    success: true,
    count: contestsWithStatus.length,
    data: contestsWithStatus
  });
});

// Join a contest
exports.joinContest = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;
  const user_id = req.auth_user.static_id;

  console.log('Join contest attempt:', {
    contest_id,
    user_id,
    user_name: req.auth_user.name,
    timestamp: new Date().toISOString()
  });

  const contest = await Contest.findById(contest_id);
  if (!contest) {
    console.log('Contest not found:', contest_id);
    throw new ErrorResponse("Contest not found", 404);
  }

  const now = new Date();
  const endTime = new Date(contest.end_time);

  // Check if contest has already ended
  if (now > endTime) {
    console.log('Contest already ended:', { contest_id, endTime, now });
    throw new ErrorResponse("Cannot join - contest has already ended", 400);
  }

  // Check if user already joined
  const existingParticipant = contest.participants.find(
    p => p.user_id.toString() === user_id
  );

  if (existingParticipant) {
    console.log('User already joined contest:', { user_id, contest_id });
    return res.status(200).json({
      success: true,
      message: "Already joined contest",
      data: {
        contest,
        participant: existingParticipant
      }
    });
  }

  // Add user to participants
  console.log('Adding user to participants:', { user_id, contest_id });
  contest.participants.push({
    user_id,
    started_at: now,
    questions_solved: 0,
    time_taken: 0,
    solved_questions: [],
    attempted_questions: []
  });

  await contest.save();
  console.log('Contest saved successfully');

  // Update user's contests_attempted
  await User.findByIdAndUpdate(user_id, {
    $addToSet: { contests_attempted: { contest_id: contest._id } }
  });
  console.log('User contests_attempted updated');

  const participant = contest.participants[contest.participants.length - 1];

  console.log('Join contest successful:', {
    user_id,
    contest_id,
    participant_id: participant._id
  });

  res.status(200).json({
    success: true,
    message: "Successfully joined contest",
    data: {
      contest,
      participant
    }
  });
});

// Get active contest for user
exports.getMyActiveContest = asyncHandler(async (req, res, next) => {
  const user_id = req.auth_user.static_id;
  const now = new Date();

  // Find contests that are active and user has joined
  const contests = await Contest.find({
    'participants.user_id': user_id,
    start_time: { $lte: now },
    end_time: { $gte: now }
  })
  .populate('questions.question_id', 'title difficulty time_limit tags content content_file');

  if (!contests || contests.length === 0) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  const contest = contests[0];
  const participant = contest.participants.find(
    p => p.user_id.toString() === user_id
  );

  // Return null if participant not found (shouldn't happen but safety check)
  if (!participant) {
    return res.status(200).json({
      success: true,
      data: null
    });
  }

  // Calculate time remaining
  const timeRemaining = Math.max(0, Math.floor((new Date(contest.end_time) - now) / 1000 / 60));
  
  // Calculate time elapsed for participant
  const timeElapsed = Math.floor((now - new Date(participant.started_at)) / 1000 / 60);

  res.status(200).json({
    success: true,
    data: {
      contest,
      participant,
      timeRemaining,
      timeElapsed
    }
  });
});

// Get contest details for user
exports.getContestDetails = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;
  const user_id = req.auth_user.static_id;

  const contest = await Contest.findById(contest_id)
    .populate('questions.question_id', 'title difficulty time_limit tags content content_file');

  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);

  const participant = contest.participants.find(
    p => p.user_id.toString() === user_id
  );

  // Determine contest status
  let status = 'ended';
  if (now < startTime) {
    status = 'not-started';
  } else if (now >= startTime && now < endTime) {
    status = 'active';
  }

  const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000 / 60));
  
  let timeElapsed = 0;
  if (participant) {
    timeElapsed = Math.floor((now - new Date(participant.started_at)) / 1000 / 60);
  }

  // Disable caching to ensure fresh participant data
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.status(200).json({
    success: true,
    data: {
      contest,
      participant,
      timeRemaining,
      timeElapsed,
      hasJoined: !!participant,
      status
    }
  });
});

// Submit solution in contest
exports.submitInContest = asyncHandler(async (req, res, next) => {
  const { contest_id, question_id } = req.body;
  const user_id = req.auth_user.static_id;

  if (!req.files || !req.files.submission_file) {
    throw new ErrorResponse("Submission file is required", 400);
  }

  const contest = await Contest.findById(contest_id);
  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  // Check if contest is active
  const now = new Date();
  if (now > new Date(contest.end_time)) {
    throw new ErrorResponse("Contest has ended", 400);
  }

  // Find participant
  const participantIndex = contest.participants.findIndex(
    p => p.user_id.toString() === user_id
  );

  if (participantIndex === -1) {
    throw new ErrorResponse("You haven't joined this contest", 400);
  }

  // Read and encode file
  const file_path = req.files.submission_file[0].path;
  const file_buffer = fs.readFileSync(file_path);
  const base64_encoded_data = file_buffer.toString("base64");
  fs.unlinkSync(file_path);

  // Create submission
  const submission = await Submission.create({
    user_id,
    question_id,
    status: "PENDING",
    execution_time: 0
  });

  // Add to queue
  await submissionQueue.add({
    question_id,
    base64_encoded_data,
    submission_id: submission._id,
    contest_id: contest._id,
    user_id: user_id
  });

  // Update participant's attempted questions
  const participant = contest.participants[participantIndex];
  const attemptedIndex = participant.attempted_questions.findIndex(
    q => q.question_id.toString() === question_id
  );

  if (attemptedIndex === -1) {
    participant.attempted_questions.push({
      question_id,
      status: "attempted"
    });
  }

  await contest.save();

  res.status(200).json({
    success: true,
    message: "Solution submitted successfully",
    results: {
      submission_id: submission._id,
      status: "PENDING"
    }
  });
});

// Get contest leaderboard
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const { contest_id } = req.params;

  const contest = await Contest.findById(contest_id)
    .populate('participants.user_id', 'name handle')
    .select('title participants start_time end_time');

  if (!contest) {
    throw new ErrorResponse("Contest not found", 404);
  }

  // Sort participants by questions_solved (desc) and time_taken (asc)
  const leaderboard = contest.participants
    .map(p => ({
      user: p.user_id,
      questions_solved: p.questions_solved,
      time_taken: p.time_taken,
      started_at: p.started_at
    }))
    .sort((a, b) => {
      if (b.questions_solved !== a.questions_solved) {
        return b.questions_solved - a.questions_solved;
      }
      return a.time_taken - b.time_taken;
    })
    .map((p, index) => ({
      rank: index + 1,
      ...p
    }));

  res.status(200).json({
    success: true,
    data: {
      contest: {
        title: contest.title,
        start_time: contest.start_time,
        end_time: contest.end_time
      },
      leaderboard
    }
  });
});

// Update contest progress (called after submission is evaluated)
exports.updateContestProgress = async (contest_id, user_id, question_id, status) => {
  try {
    const contest = await Contest.findById(contest_id);
    if (!contest) return;

    const participantIndex = contest.participants.findIndex(
      p => p.user_id.toString() === user_id.toString()
    );

    if (participantIndex === -1) return;

    const participant = contest.participants[participantIndex];

    // Update attempted question status
    const attemptedIndex = participant.attempted_questions.findIndex(
      q => q.question_id.toString() === question_id.toString()
    );

    if (status === "ACCEPTED") {
      // Check if not already solved
      const alreadySolved = participant.solved_questions.find(
        q => q.question_id.toString() === question_id.toString()
      );

      if (!alreadySolved) {
        participant.solved_questions.push({
          question_id,
          solved_at: new Date()
        });
        participant.questions_solved += 1;

        // Update time taken
        const now = new Date();
        participant.time_taken = Math.floor((now - new Date(participant.started_at)) / 1000 / 60);
      }

      if (attemptedIndex !== -1) {
        participant.attempted_questions[attemptedIndex].status = "solved";
      }
    } else {
      if (attemptedIndex !== -1) {
        participant.attempted_questions[attemptedIndex].status = "incorrect";
      }
    }

    await contest.save();
  } catch (error) {
    console.error("Error updating contest progress:", error);
  }
};

module.exports = {
  getAllContests: exports.getAllContests,
  joinContest: exports.joinContest,
  getMyActiveContest: exports.getMyActiveContest,
  getContestDetails: exports.getContestDetails,
  submitInContest: exports.submitInContest,
  getLeaderboard: exports.getLeaderboard,
  updateContestProgress: exports.updateContestProgress
};
