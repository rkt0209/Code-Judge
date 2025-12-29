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
    enum: ["PENDING", "ACCEPTED", "WRONG ANSWER", "TIME LIMIT EXCEEDED", "COMPILATION ERROR"],
    default: "PENDING",
    required: true,
  },
  execution_time: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Submission", SubmissionSchema);