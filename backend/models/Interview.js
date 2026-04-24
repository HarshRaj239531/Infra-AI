const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  score: { type: Number, default: 0 }, // 0-10
  feedback: { type: String, default: '' },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    resumeText: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['fresher', 'junior', 'mid', 'senior'],
      default: 'fresher',
    },
    qaList: [qaSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    overallFeedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
    totalQuestions: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
