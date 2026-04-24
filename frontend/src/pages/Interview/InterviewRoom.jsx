import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../../services/api';
import {
  Mic, MicOff, Send, Brain, ChevronRight, CheckCircle,
  Volume2, VolumeX, AlertCircle, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Interview.css';

const InterviewRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState(
    location.state?.firstQuestion || ''
  );
  const [questionNum, setQuestionNum] = useState(location.state?.questionNumber || 1);
  const [totalQuestions] = useState(location.state?.totalQuestions || 5);
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(!location.state?.firstQuestion);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const textareaRef = useRef(null);

  // Speak question aloud
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // Auto-speak first question
  useEffect(() => {
    if (currentQuestion) {
      setTimeout(() => speakText(currentQuestion), 600);
      setChatHistory([{ type: 'question', text: currentQuestion, num: questionNum }]);
    }
  }, []);

  // Speech recognition setup
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser. Please type your answer.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer((prev) => prev + ' ' + transcript);
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    stopSpeaking();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast.error('Please provide an answer before submitting');
      return;
    }

    setSubmitting(true);
    stopListening();
    stopSpeaking();

    const currentAns = answer.trim();

    // Add to chat
    setChatHistory((prev) => [
      ...prev,
      { type: 'answer', text: currentAns },
    ]);
    setAnswer('');

    try {
      const res = await interviewAPI.submitAnswer(id, { answer: currentAns });

      // Show feedback
      setLastFeedback({ score: res.data.score, text: res.data.feedback });

      // Add feedback to chat
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'feedback',
          score: res.data.score,
          text: res.data.feedback,
        },
      ]);

      if (res.data.isComplete) {
        setIsComplete(true);
      } else if (res.data.nextQuestion) {
        setCurrentQuestion(res.data.nextQuestion);
        setQuestionNum(res.data.questionNumber);

        // Add next question to chat
        setChatHistory((prev) => [
          ...prev,
          { type: 'question', text: res.data.nextQuestion, num: res.data.questionNumber },
        ]);

        setTimeout(() => speakText(res.data.nextQuestion), 800);
        setLastFeedback(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
      setAnswer(currentAns);
    } finally {
      setSubmitting(false);
    }
  };

  // End interview and go to report
  const handleEndInterview = async () => {
    setSubmitting(true);
    stopListening();
    stopSpeaking();
    try {
      await interviewAPI.endInterview(id);
      toast.success('Interview completed! Generating your report...');
      navigate(`/report/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end interview');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  const progress = Math.round((questionNum / totalQuestions) * 100);

  if (loading) {
    return (
      <div className="page">
        <div className="container page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container page-content">
        <div className="interview-layout animate-fade-in">
          {/* Main Interview Area */}
          <div className="interview-main">
            {/* Progress Bar */}
            <div className="interview-progress-wrap">
              <div className="interview-progress-info">
                <span>Question {Math.min(questionNum, totalQuestions)} of {totalQuestions}</span>
                <span>{progress}% Complete</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Chat History */}
            <div className="chat-container">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-msg chat-msg-${msg.type} animate-fade-in`}>
                  {msg.type === 'question' && (
                    <div className="chat-question">
                      <div className="chat-question-header">
                        <div className="ai-avatar">
                          <Brain size={16} />
                        </div>
                        <span>AI Interviewer · Q{msg.num}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  )}
                  {msg.type === 'answer' && (
                    <div className="chat-answer">
                      <div className="chat-answer-header">
                        <MessageSquare size={14} />
                        <span>Your Answer</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  )}
                  {msg.type === 'feedback' && (
                    <div
                      className="chat-feedback"
                      style={{ borderColor: `${getScoreColor(msg.score)}40` }}
                    >
                      <div className="feedback-score" style={{ color: getScoreColor(msg.score) }}>
                        Score: {msg.score}/10
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            {!isComplete ? (
              <div className="input-area">
                {/* Voice Controls */}
                <div className="voice-controls">
                  <button
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    disabled={submitting}
                    title={isListening ? 'Stop Recording' : 'Start Voice Input'}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    {isListening ? 'Stop Recording' : 'Voice Answer'}
                  </button>
                  <button
                    className={`voice-btn tts-btn ${isSpeaking ? 'active' : ''}`}
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(currentQuestion)}
                    title="Read question aloud"
                  >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    {isSpeaking ? 'Stop' : 'Read Question'}
                  </button>
                </div>

                {isListening && (
                  <div className="listening-indicator">
                    <div className="pulse-ring" />
                    <div className="pulse-ring pulse-ring-2" />
                    <Mic size={14} />
                    <span>Listening... speak your answer</span>
                  </div>
                )}

                <div className="answer-input-area">
                  <textarea
                    ref={textareaRef}
                    className="answer-textarea"
                    placeholder="Type your answer here or use voice input above..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                    disabled={submitting}
                  />
                  <button
                    className="submit-answer-btn btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting || !answer.trim()}
                    id="submit-answer-btn"
                  >
                    {submitting ? (
                      <>
                        <div className="spinner spinner-sm" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Submit <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="complete-section">
                <div className="complete-icon">
                  <CheckCircle size={40} color="#10b981" />
                </div>
                <h3>All Questions Answered!</h3>
                <p>Click below to end the interview and get your detailed performance report.</p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleEndInterview}
                  disabled={submitting}
                  id="end-interview-btn"
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      View My Report <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="interview-sidebar">
            <div className="card sidebar-info">
              <h4 style={{ marginBottom: 16, fontWeight: 700 }}>📋 Session Info</h4>
              <div className="sidebar-info-item">
                <span>Total Questions</span>
                <strong>{totalQuestions}</strong>
              </div>
              <div className="sidebar-info-item">
                <span>Answered</span>
                <strong>{Math.max(0, questionNum - 1)}</strong>
              </div>
              <div className="sidebar-info-item">
                <span>Remaining</span>
                <strong>{Math.max(0, totalQuestions - questionNum + 1)}</strong>
              </div>
            </div>

            {lastFeedback && (
              <div
                className="card last-feedback-card"
                style={{ borderColor: `${getScoreColor(lastFeedback.score)}40` }}
              >
                <div
                  className="last-score"
                  style={{ color: getScoreColor(lastFeedback.score) }}
                >
                  {lastFeedback.score}/10
                </div>
                <p className="last-score-label">Last Answer Score</p>
                <p className="last-feedback-text">{lastFeedback.text}</p>
              </div>
            )}

            <div className="card tips-card-sm">
              <h4 style={{ marginBottom: 12, fontSize: '0.85rem', fontWeight: 700 }}>
                💡 Interview Tips
              </h4>
              <ul className="tips-list-sm">
                <li>Be specific with examples</li>
                <li>Use STAR method for behavioral questions</li>
                <li>Think before you speak</li>
                <li>It's okay to ask for clarification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
