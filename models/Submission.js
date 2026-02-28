const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  status: {
    type: String,
    // 🟢 ADD "PENDING" TO THIS LIST
    enum: ["PENDING", "ACCEPTED", "WRONG ANSWER", "TIME LIMIT EXCEEDED", "COMPILATION ERROR", "IN_RETRY", "FAILED_RETRY"],
    default: "PENDING",
    required: true,
  },
  execution_time: {
    type: Number,
    default: 0
  },
  retry_count: {
    type: Number,
    default: 0,
    max: 3
  },
  retry_history: [{
    attempt: Number,
    status: String,
    error_message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  last_retry_at: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Submission", SubmissionSchema);