const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  startInterview,
  submitAnswer,
  endInterview,
  getHistory,
  getReport,
} = require('../controllers/interviewController');

// Multer setup - memory storage for PDF parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

router.get('/history', protect, getHistory);
router.post('/start', protect, upload.single('resume'), startInterview);
router.post('/:id/answer', protect, submitAnswer);
router.post('/:id/end', protect, endInterview);
router.get('/:id', protect, getReport);

module.exports = router;
