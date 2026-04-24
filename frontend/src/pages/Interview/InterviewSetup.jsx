import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Upload, FileText, Briefcase, ChevronRight, X, Brain,
  AlertCircle, Coins
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Interview.css';

const jobRoles = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'React Developer', 'Node.js Developer', 'Python Developer',
  'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
  'Android Developer', 'iOS Developer', 'UI/UX Designer',
  'Data Analyst', 'Cloud Engineer', 'Cybersecurity Analyst',
  'Database Administrator', 'Software Engineer', 'System Analyst',
];

const InterviewSetup = () => {
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('fresher');
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const selectedRole = jobRole === 'custom' ? customRole : jobRole;

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleStart = async () => {
    if (!selectedRole.trim()) {
      toast.error('Please select or enter a job role');
      return;
    }
    if (user.credits <= 0) {
      toast.error('Insufficient credits!');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('jobRole', selectedRole.trim());
      formData.append('experienceLevel', experienceLevel);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await interviewAPI.start(formData);
      updateCredits(user.credits - 1);
      toast.success('Interview started! Good luck! 🚀');
      navigate(`/interview/${res.data.interviewId}`, {
        state: {
          firstQuestion: res.data.question,
          questionNumber: 1,
          totalQuestions: res.data.totalQuestions,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container page-content">
        <div className="setup-layout animate-fade-in">
          {/* Left Panel */}
          <div className="setup-main">
            <div className="setup-header">
              <h1>Setup Your Interview</h1>
              <p>Configure your mock interview session for personalized AI questions.</p>
            </div>

            {/* Resume Upload */}
            <div className="setup-section card">
              <div className="setup-section-title">
                <FileText size={18} />
                Resume Upload <span className="optional-tag">(Optional)</span>
              </div>
              <p className="setup-section-desc">
                Upload your PDF resume so AI can generate questions tailored to your background.
              </p>

              {!resumeFile ? (
                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => document.getElementById('resume-input').click()}
                >
                  <Upload size={32} className="upload-icon" />
                  <p className="upload-text">
                    <strong>Click to upload</strong> or drag & drop
                  </p>
                  <p className="upload-hint">PDF only · Max 5MB</p>
                  <input
                    id="resume-input"
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={(e) => handleFileChange(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="file-preview">
                  <FileText size={20} color="#6366f1" />
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">
                    {(resumeFile.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    className="file-remove"
                    onClick={() => setResumeFile(null)}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Job Role */}
            <div className="setup-section card">
              <div className="setup-section-title">
                <Briefcase size={18} />
                Target Job Role <span className="required-tag">*</span>
              </div>

              <div className="roles-grid">
                {jobRoles.map((role) => (
                  <button
                    key={role}
                    className={`role-chip ${jobRole === role ? 'selected' : ''}`}
                    onClick={() => { setJobRole(role); setCustomRole(''); }}
                  >
                    {role}
                  </button>
                ))}
                <button
                  className={`role-chip ${jobRole === 'custom' ? 'selected' : ''}`}
                  onClick={() => setJobRole('custom')}
                >
                  + Custom Role
                </button>
              </div>

              {jobRole === 'custom' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your specific role..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  style={{ marginTop: 16 }}
                  autoFocus
                />
              )}
            </div>

            {/* Experience Level */}
            <div className="setup-section card">
              <div className="setup-section-title">
                <Brain size={18} />
                Experience Level
              </div>
              <div className="exp-options">
                {[
                  { val: 'fresher', label: 'Fresher', desc: '0-1 year' },
                  { val: 'junior', label: 'Junior', desc: '1-3 years' },
                  { val: 'mid', label: 'Mid-Level', desc: '3-5 years' },
                  { val: 'senior', label: 'Senior', desc: '5+ years' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    className={`exp-option ${experienceLevel === opt.val ? 'selected' : ''}`}
                    onClick={() => setExperienceLevel(opt.val)}
                  >
                    <span className="exp-label">{opt.label}</span>
                    <span className="exp-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Summary */}
          <div className="setup-sidebar">
            <div className="sidebar-card card-glow">
              <h3 className="sidebar-title">Interview Summary</h3>

              <div className="summary-items">
                <div className="summary-item">
                  <span className="summary-label">Role</span>
                  <span className="summary-value">
                    {selectedRole || <span className="summary-placeholder">Not selected</span>}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Level</span>
                  <span className="summary-value" style={{ textTransform: 'capitalize' }}>
                    {experienceLevel}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Resume</span>
                  <span className="summary-value">
                    {resumeFile ? resumeFile.name.substring(0, 20) + '...' : 'Not uploaded'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Questions</span>
                  <span className="summary-value">5 Questions</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Cost</span>
                  <span className="summary-value credits-cost">
                    <Coins size={14} /> 1 Credit
                  </span>
                </div>
              </div>

              <div className="divider" />

              {user?.credits === 0 && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <AlertCircle size={14} />
                  No credits remaining
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleStart}
                disabled={loading || !selectedRole.trim() || user?.credits === 0}
                id="start-interview-confirm-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Interview <ChevronRight size={18} />
                  </>
                )}
              </button>

              <p className="credits-remaining">
                <Coins size={12} />
                {user?.credits} credit{user?.credits !== 1 ? 's' : ''} remaining
              </p>
            </div>

            {/* Tips */}
            <div className="tips-card card">
              <h4 className="tips-title">💡 Tips for Success</h4>
              <ul className="tips-list">
                <li>Upload your resume for more relevant questions</li>
                <li>Use voice mode for a realistic experience</li>
                <li>Take your time — quality over speed</li>
                <li>Review feedback after each session</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
