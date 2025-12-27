// File: models/Question.js
const mongoose = require("mongoose");

const QuestionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true
    },
    content: {
      type: String,
      required: true,
    },
    solution_file: {
      type: String,
      required: true,
    },
    input_file: {
      type: String,
      required: true,
    },
    time_limit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", QuestionSchema);

module.exports = Question;