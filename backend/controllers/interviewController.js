const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const Interview = require('../models/Interview');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models to try in order (fallback chain)
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

// Helper: call Gemini with retry + model fallback
const callGemini = async (prompt) => {
  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        console.error(`Gemini Error (${modelName}, attempt ${attempt}):`, err.message);
        
        if (err.message?.includes('403')) {
          throw new Error('Gemini API key is invalid or has been revoked (possibly due to a leak). Please check your .env file.');
        }

        const isRetryable = err.message?.includes('503') || err.message?.includes('429');
        if (isRetryable && attempt === 1) {
          console.log(`Retrying ${modelName} in 3s...`);
          // Wait 3s and retry same model once
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        // Move to next model
        break;
      }
    }
  }
  throw new Error('All Gemini models are currently unavailable. Please try again in a minute.');
};

// @desc    Upload resume and start interview session
// @route   POST /api/interview/start
// @access  Private
const startInterview = async (req, res) => {
  try {
    const { jobRole, experienceLevel } = req.body;

    if (!jobRole) {
      return res.status(400).json({ message: 'Job role is required' });
    }

    // Check credits
    const user = await User.findById(req.user._id);
    if (user.credits <= 0) {
      return res.status(403).json({ message: 'Insufficient credits. Please purchase more.' });
    }

    let resumeText = '';

    // Parse PDF if uploaded
    if (req.file) {
      const pdfData = await pdf(req.file.buffer);
      resumeText = pdfData.text.substring(0, 3000); // Limit text
    }

    // Generate first question from Gemini
    const resumeContext = resumeText
      ? `The candidate's resume says: "${resumeText}"`
      : 'No resume provided.';

    const prompt = `You are an expert technical interviewer. 
${resumeContext}
The candidate is applying for: ${jobRole} (${experienceLevel || 'fresher'} level).

Generate 1 strong, relevant technical interview question to start the interview. 
The question should be appropriate for the experience level.
Return ONLY the question text, nothing else.`;

    const firstQuestion = await callGemini(prompt);

    // Deduct 1 credit
    await User.findByIdAndUpdate(req.user._id, { $inc: { credits: -1 } });

    // Create interview record
    const interview = await Interview.create({
      userId: req.user._id,
      jobRole,
      resumeText,
      experienceLevel: experienceLevel || 'fresher',
      qaList: [{ question: firstQuestion.trim() }],
      status: 'in-progress',
    });

    res.status(201).json({
      message: 'Interview started',
      interviewId: interview._id,
      question: firstQuestion.trim(),
      questionNumber: 1,
      totalQuestions: interview.totalQuestions,
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Failed to start interview: ' + error.message });
  }
};

// @desc    Submit answer, get score + next question
// @route   POST /api/interview/:id/answer
// @access  Private
const submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'Interview already completed' });
    }

    // Find unanswered question
    const currentIndex = interview.qaList.findIndex((qa) => !qa.answer);
    if (currentIndex === -1) {
      return res.status(400).json({ message: 'No pending question found' });
    }

    const currentQuestion = interview.qaList[currentIndex].question;

    // Evaluate answer with Gemini
    const evalPrompt = `You are a strict but fair technical interviewer evaluating a candidate's response.

Job Role: ${interview.jobRole}
Experience Level: ${interview.experienceLevel}
Question: "${currentQuestion}"
Candidate's Answer: "${answer}"

Evaluate this answer and respond in the following JSON format ONLY (no extra text):
{
  "score": <integer from 0 to 10>,
  "feedback": "<2-3 sentence constructive feedback on the answer>"
}`;

    const evalResponse = await callGemini(evalPrompt);

    let scoreData = { score: 5, feedback: 'Answer recorded.' };
    try {
      const jsonMatch = evalResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scoreData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('JSON parse error, using defaults');
    }

    // Update current answer
    interview.qaList[currentIndex].answer = answer;
    interview.qaList[currentIndex].score = scoreData.score;
    interview.qaList[currentIndex].feedback = scoreData.feedback;

    // Check if we need more questions
    const totalAsked = interview.qaList.length;
    let nextQuestion = null;

    if (totalAsked < interview.totalQuestions) {
      // Generate next question
      const previousQA = interview.qaList
        .filter((qa) => qa.answer)
        .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n');

      const nextQPrompt = `You are a technical interviewer for ${interview.jobRole} (${interview.experienceLevel} level).

Previous questions and answers:
${previousQA}

Generate the next interview question. It should be different from previous questions and progressively explore the candidate's knowledge. 
Return ONLY the question text, nothing else.`;

      nextQuestion = (await callGemini(nextQPrompt)).trim();
      interview.qaList.push({ question: nextQuestion });
    }

    await interview.save();

    const isLastQuestion = totalAsked >= interview.totalQuestions;

    res.json({
      score: scoreData.score,
      feedback: scoreData.feedback,
      nextQuestion: nextQuestion,
      questionNumber: totalAsked + (nextQuestion ? 1 : 0),
      isComplete: isLastQuestion,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Failed to process answer: ' + error.message });
  }
};

// @desc    End interview and get final report
// @route   POST /api/interview/:id/end
// @access  Private
const endInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const answeredQA = interview.qaList.filter((qa) => qa.answer);

    if (answeredQA.length === 0) {
      return res.status(400).json({ message: 'No answers to evaluate' });
    }

    // Calculate overall score
    const totalScore = answeredQA.reduce((sum, qa) => sum + (qa.score || 0), 0);
    const overallScore = Math.round(totalScore / answeredQA.length);

    // Get overall AI feedback
    const allQA = answeredQA
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA: ${qa.answer}\nScore: ${qa.score}/10`)
      .join('\n\n');

    const feedbackPrompt = `You are a senior technical interviewer. Here is the complete interview session for a ${interview.jobRole} position (${interview.experienceLevel} level):

${allQA}

Provide a comprehensive performance summary in 3-4 sentences covering:
1. Overall technical knowledge assessment
2. Key strengths demonstrated
3. Areas that need improvement
4. Final recommendation

Be specific, constructive, and professional.`;

    const overallFeedback = await callGemini(feedbackPrompt);

    interview.overallScore = overallScore;
    interview.overallFeedback = overallFeedback.trim();
    interview.status = 'completed';
    await interview.save();

    res.json({
      message: 'Interview completed',
      interviewId: interview._id,
      overallScore,
      overallFeedback: overallFeedback.trim(),
      totalQuestions: answeredQA.length,
    });
  } catch (error) {
    console.error('End interview error:', error);
    res.status(500).json({ message: 'Failed to end interview: ' + error.message });
  }
};

// @desc    Get all interviews for user
// @route   GET /api/interview/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id })
      .select('jobRole experienceLevel overallScore status createdAt totalQuestions qaList')
      .sort({ createdAt: -1 });

    res.json({ interviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single interview report
// @route   GET /api/interview/:id
// @access  Private
const getReport = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  startInterview,
  submitAnswer,
  endInterview,
  getHistory,
  getReport,
};
