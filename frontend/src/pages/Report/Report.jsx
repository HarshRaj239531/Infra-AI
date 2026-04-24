import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell
} from 'recharts';
import {
  Brain, ArrowLeft, Trophy, Clock, CheckCircle, XCircle,
  AlertCircle, Download, RotateCcw, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Report.css';

const ScoreTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p>{payload[0].payload.question}</p>
        <p className="tooltip-score">Score: <strong>{payload[0].value}/10</strong></p>
      </div>
    );
  }
  return null;
};

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewAPI
      .getReport(id)
      .then((res) => setInterview(res.data.interview))
      .catch(() => {
        toast.error('Failed to load report');
        navigate('/history');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const answeredQA = interview.qaList.filter((qa) => qa.answer);
  const chartData = answeredQA.map((qa, i) => ({
    name: `Q${i + 1}`,
    score: qa.score || 0,
    question: qa.question.substring(0, 60) + '...',
  }));

  const overallScore = interview.overallScore || 0;

  const getScoreLabel = (score) => {
    if (score >= 8) return { label: 'Excellent', color: '#10b981', cls: 'excellent' };
    if (score >= 6) return { label: 'Good', color: '#f59e0b', cls: 'good' };
    if (score >= 4) return { label: 'Average', color: '#f97316', cls: 'average' };
    return { label: 'Needs Work', color: '#ef4444', cls: 'poor' };
  };

  const scoreInfo = getScoreLabel(overallScore);

  const getBarColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="page">
      <div className="container page-content">
        {/* Back */}
        <Link to="/history" className="back-link animate-fade-in">
          <ArrowLeft size={16} />
          Back to History
        </Link>

        {/* Report Header */}
        <div className="report-header animate-fade-in">
          <div className="report-header-left">
            <h1 className="report-title">{interview.jobRole}</h1>
            <div className="report-meta">
              <span className="badge badge-primary">{interview.experienceLevel}</span>
              <span className="report-date">
                <Clock size={14} />
                {new Date(interview.createdAt).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="report-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Download size={14} />
              Save Report
            </button>
            <Link to="/interview/setup" className="btn btn-primary btn-sm">
              <RotateCcw size={14} />
              Practice Again
            </Link>
          </div>
        </div>

        {/* Overall Score Card */}
        <div className={`overall-score-card animate-fade-in score-${scoreInfo.cls}`}>
          <div className="overall-score-left">
            <div className="overall-score-circle" style={{ borderColor: scoreInfo.color }}>
              <span className="overall-score-num" style={{ color: scoreInfo.color }}>
                {overallScore}
              </span>
              <span className="overall-score-denom">/10</span>
            </div>
            <div>
              <div
                className="overall-score-label"
                style={{ color: scoreInfo.color }}
              >
                {scoreInfo.label}
              </div>
              <p className="overall-score-sub">
                Based on {answeredQA.length} answered questions
              </p>
            </div>
          </div>
          <div className="overall-metrics">
            {[
              {
                label: 'Questions Answered',
                val: answeredQA.length,
                icon: <MessageSquare size={16} />,
              },
              {
                label: 'Avg Score',
                val: `${overallScore}/10`,
                icon: <Trophy size={16} />,
              },
              {
                label: 'Best Answer',
                val: answeredQA.length > 0
                  ? `${Math.max(...answeredQA.map((q) => q.score || 0))}/10`
                  : '—',
                icon: <CheckCircle size={16} />,
              },
            ].map((m) => (
              <div key={m.label} className="metric-item">
                <div className="metric-icon">{m.icon}</div>
                <span className="metric-val">{m.val}</span>
                <span className="metric-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Feedback */}
        {interview.overallFeedback && (
          <div className="ai-feedback-card card animate-fade-in">
            <div className="ai-feedback-header">
              <div className="ai-avatar-lg">
                <Brain size={20} />
              </div>
              <div>
                <h3>AI Performance Summary</h3>
                <p>Detailed assessment by Gemini AI</p>
              </div>
            </div>
            <p className="ai-feedback-text">{interview.overallFeedback}</p>
          </div>
        )}

        {/* Score Chart */}
        {chartData.length > 0 && (
          <div className="chart-card card animate-fade-in">
            <h3 className="chart-title">
              <BarChart size={18} />
              Score Breakdown per Question
            </h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ScoreTooltip />} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {[
                { color: '#10b981', label: 'Excellent (8-10)' },
                { color: '#f59e0b', label: 'Good (6-7)' },
                { color: '#ef4444', label: 'Needs Work (0-5)' },
              ].map((l) => (
                <div key={l.label} className="legend-item">
                  <div className="legend-dot" style={{ background: l.color }} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q&A Detailed Review */}
        <div className="qa-review animate-fade-in">
          <h3 className="qa-review-title">
            <MessageSquare size={20} />
            Detailed Q&A Review
          </h3>

          {answeredQA.map((qa, idx) => (
            <div key={idx} className="qa-item card">
              <div className="qa-item-header">
                <div className="qa-num">Q{idx + 1}</div>
                <div className="qa-question">{qa.question}</div>
                <div
                  className="qa-score-badge"
                  style={{
                    color: getBarColor(qa.score || 0),
                    borderColor: `${getBarColor(qa.score || 0)}40`,
                    background: `${getBarColor(qa.score || 0)}15`,
                  }}
                >
                  {qa.score || 0}/10
                </div>
              </div>

              <div className="qa-score-bar">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${((qa.score || 0) / 10) * 100}%`,
                      background: getBarColor(qa.score || 0),
                    }}
                  />
                </div>
              </div>

              <div className="qa-answer-block">
                <div className="qa-block-label">
                  <MessageSquare size={12} />
                  Your Answer
                </div>
                <p className="qa-answer-text">{qa.answer}</p>
              </div>

              {qa.feedback && (
                <div className="qa-feedback-block">
                  <div className="qa-block-label feedback-label">
                    <Brain size={12} />
                    AI Feedback
                  </div>
                  <p className="qa-feedback-text">{qa.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="report-cta card-glow animate-fade-in">
          <h3>Keep Improving Your Skills</h3>
          <p>Regular practice is the key to mastering interviews. Start another session!</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <Link to="/interview/setup" className="btn btn-primary">
              <RotateCcw size={16} />
              Practice Again
            </Link>
            <Link to="/history" className="btn btn-secondary">
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
