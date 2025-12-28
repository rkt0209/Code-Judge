const mongoose = require("mongoose");

const SubmissionSchema = mongoose.Schema(
  {
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
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["cpp", "c", "java", "python"], // Allowed languages
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Accepted", "Wrong Answer", "Time Limit Exceeded", "Compilation Error"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);