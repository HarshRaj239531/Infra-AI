import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { interviewAPI } from '../../services/api';
import {
  Brain, Plus, History, Trophy, Zap, Clock,
  TrendingUp, Target, ChevronRight, Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewAPI
      .getHistory()
      .then((res) => setRecentInterviews(res.data.interviews.slice(0, 3)))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const completedInterviews = recentInterviews.filter(
    (i) => i.status === 'completed'
  );
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((s, i) => s + i.overallScore, 0) /
            completedInterviews.length
        )
      : 0;

  const statsCards = [
    {
      icon: <Trophy size={22} />,
      label: 'Avg Score',
      value: avgScore > 0 ? `${avgScore}/10` : '—',
      color: '#f59e0b',
      sub: 'Across all sessions',
    },
    {
      icon: <Zap size={22} />,
      label: 'Interviews',
      value: recentInterviews.length,
      color: '#6366f1',
      sub: 'Sessions completed',
    },
    {
      icon: <Coins size={22} />,
      label: 'Credits',
      value: user?.credits ?? 0,
      color: '#10b981',
      sub: 'Available to use',
    },
    {
      icon: <TrendingUp size={22} />,
      label: 'Best Score',
      value: completedInterviews.length > 0
        ? `${Math.max(...completedInterviews.map((i) => i.overallScore))}/10`
        : '—',
      color: '#06b6d4',
      sub: 'Personal best',
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreBadge = (score) => {
    if (score >= 8) return 'badge-success';
    if (score >= 6) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="page">
      <div className="container page-content">
        {/* Header */}
        <div className="dashboard-header animate-fade-in">
          <div>
            <h1 className="dashboard-title">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}! 👋</span>
            </h1>
            <p className="dashboard-subtitle">
              Ready to practice? Start a new interview session below.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/interview/setup')}
            id="start-interview-btn"
          >
            <Plus size={18} />
            New Interview
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid animate-fade-in">
          {statsCards.map((s) => (
            <div key={s.label} className="stat-card card">
              <div
                className="stat-icon"
                style={{ background: `${s.color}20`, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="stat-info">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-sub">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Banner */}
        {user?.credits > 0 && (
          <div className="quick-start-banner animate-fade-in">
            <div className="quick-start-content">
              <div className="quick-start-icon">
                <Brain size={28} />
              </div>
              <div>
                <h3>Start Your Interview Practice</h3>
                <p>Upload your resume and select a job role to begin an AI-powered mock interview session.</p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/interview/setup')}
            >
              Start Now <ChevronRight size={16} />
            </button>
          </div>
        )}

        {user?.credits === 0 && (
          <div className="no-credits-banner animate-fade-in">
            <div>
              <h3>Out of Credits</h3>
              <p>You've used all your free credits. Purchase more to continue practicing.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/buy-credits')}
              id="buy-credits-btn"
            >
              <Coins size={16} />
              Buy Credits
            </button>
          </div>
        )}

        {/* Recent Interviews */}
        <div className="section-block animate-fade-in">
          <div className="section-block-header">
            <h2>
              <History size={20} />
              Recent Interviews
            </h2>
            <Link to="/history" className="view-all-link">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="interviews-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
              ))}
            </div>
          ) : recentInterviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Target size={36} />
              </div>
              <h3>No interviews yet</h3>
              <p>Start your first AI mock interview to see your results here.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/interview/setup')}
              >
                <Plus size={16} />
                Start First Interview
              </button>
            </div>
          ) : (
            <div className="interviews-list">
              {recentInterviews.map((interview) => (
                <Link
                  key={interview._id}
                  to={`/report/${interview._id}`}
                  className="interview-row"
                >
                  <div className="interview-row-left">
                    <div className="interview-role-icon">
                      <Brain size={18} />
                    </div>
                    <div>
                      <h4 className="interview-role">{interview.jobRole}</h4>
                      <div className="interview-meta">
                        <span className="badge badge-primary">{interview.experienceLevel}</span>
                        <span className="interview-date">
                          <Clock size={12} />
                          {new Date(interview.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="interview-row-right">
                    {interview.status === 'completed' ? (
                      <div
                        className={`badge ${getScoreBadge(interview.overallScore)}`}
                        style={{ fontSize: '0.9rem', padding: '6px 14px' }}
                      >
                        {interview.overallScore}/10
                      </div>
                    ) : (
                      <div className="badge badge-warning">In Progress</div>
                    )}
                    <ChevronRight size={16} className="row-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
