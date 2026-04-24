import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewAPI } from '../../services/api';
import {
  Brain, Clock, ChevronRight, Trophy, Filter, Search,
  TrendingUp, Calendar, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import './History.css';

const History = () => {
  const [interviews, setInterviews] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    interviewAPI
      .getHistory()
      .then((res) => {
        setInterviews(res.data.interviews);
        setFiltered(res.data.interviews);
      })
      .catch(() => toast.error('Failed to load interview history'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = interviews;
    if (search) {
      result = result.filter((i) =>
        i.jobRole.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, interviews]);

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

  const completedInterviews = interviews.filter((i) => i.status === 'completed');
  const avgScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce((s, i) => s + i.overallScore, 0) /
            completedInterviews.length
        )
      : 0;

  return (
    <div className="page">
      <div className="container page-content">
        {/* Header */}
        <div className="history-header animate-fade-in">
          <div>
            <h1 className="history-title">
              <Trophy size={28} />
              Interview History
            </h1>
            <p className="history-subtitle">
              Track your progress and review past performance.
            </p>
          </div>
          <Link to="/interview/setup" className="btn btn-primary">
            <Plus size={16} />
            New Interview
          </Link>
        </div>

        {/* Summary Stats */}
        {!loading && completedInterviews.length > 0 && (
          <div className="history-stats animate-fade-in">
            <div className="hstat-card card">
              <div className="hstat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                <Brain size={20} />
              </div>
              <div>
                <span className="hstat-val">{interviews.length}</span>
                <span className="hstat-label">Total Sessions</span>
              </div>
            </div>
            <div className="hstat-card card">
              <div className="hstat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="hstat-val">{avgScore}/10</span>
                <span className="hstat-label">Average Score</span>
              </div>
            </div>
            <div className="hstat-card card">
              <div className="hstat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                <Trophy size={20} />
              </div>
              <div>
                <span className="hstat-val">
                  {completedInterviews.length > 0
                    ? Math.max(...completedInterviews.map((i) => i.overallScore))
                    : '—'}/10
                </span>
                <span className="hstat-label">Best Score</span>
              </div>
            </div>
            <div className="hstat-card card">
              <div className="hstat-icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9' }}>
                <Calendar size={20} />
              </div>
              <div>
                <span className="hstat-val">{completedInterviews.length}</span>
                <span className="hstat-label">Completed</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="history-filters animate-fade-in">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by job role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="history-search"
            />
          </div>
          <div className="filter-buttons">
            {['all', 'completed', 'in-progress'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'In Progress'}
              </button>
            ))}
          </div>
        </div>

        {/* Interview List */}
        {loading ? (
          <div className="history-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">
              <Brain size={36} />
            </div>
            <h3>{interviews.length === 0 ? 'No interviews yet' : 'No results found'}</h3>
            <p>
              {interviews.length === 0
                ? 'Start your first interview to see results here.'
                : 'Try adjusting your search or filters.'}
            </p>
            {interviews.length === 0 && (
              <Link to="/interview/setup" className="btn btn-primary">
                <Plus size={16} />
                Start First Interview
              </Link>
            )}
          </div>
        ) : (
          <div className="history-grid animate-fade-in">
            {filtered.map((interview) => (
              <Link
                key={interview._id}
                to={`/report/${interview._id}`}
                className="history-card card"
              >
                <div className="hcard-header">
                  <div className="hcard-role-icon">
                    <Brain size={18} />
                  </div>
                  <div
                    className={`badge ${
                      interview.status === 'completed'
                        ? getScoreBadge(interview.overallScore)
                        : 'badge-warning'
                    }`}
                  >
                    {interview.status === 'completed'
                      ? `${interview.overallScore}/10`
                      : 'In Progress'}
                  </div>
                </div>

                <h3 className="hcard-role">{interview.jobRole}</h3>

                <div className="hcard-meta">
                  <span className="badge badge-primary">{interview.experienceLevel}</span>
                  <span className="hcard-questions">
                    {interview.qaList?.filter((q) => q.answer).length || 0}/{interview.totalQuestions} Q&A
                  </span>
                </div>

                <div className="hcard-footer">
                  <span className="hcard-date">
                    <Clock size={12} />
                    {new Date(interview.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="view-report-link">
                    View Report <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
