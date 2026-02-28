const mongoose = require("mongoose");

const ContestSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      default: ""
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    questions: [
      {
        question_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
      },
    ],
    participants: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        started_at: {
          type: Date,
          default: Date.now
        },
        questions_solved: {
          type: Number,
          default: 0
        },
        time_taken: {
          type: Number, // in minutes
          default: 0
        },
        solved_questions: [
          {
            question_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Question",
            },
            solved_at: Date,
          }
        ],
        attempted_questions: [
          {
            question_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Question",
            },
            status: {
              type: String,
              enum: ["attempted", "solved", "incorrect"]
            }
          }
        ]
      },
    ],
  },
  { timestamps: true }
);

const Contest = mongoose.model("Contest", ContestSchema);

module.exports = Contest;
