import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Brain, Mic, FileText, BarChart3, Shield, Zap,
  ChevronRight, Star, ArrowRight, CheckCircle, Sparkles
} from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Brain size={24} />,
    title: 'AI-Powered Questions',
    desc: 'Gemini AI generates personalized interview questions based on your resume and target role.',
    color: '#6366f1',
  },
  {
    icon: <Mic size={24} />,
    title: 'Voice-Based Interviews',
    desc: 'Answer questions verbally with Web Speech API for the most realistic interview experience.',
    color: '#06b6d4',
  },
  {
    icon: <FileText size={24} />,
    title: 'Resume Analysis',
    desc: 'Upload your PDF resume and our AI extracts your skills to craft targeted questions.',
    color: '#f59e0b',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Performance Analytics',
    desc: 'Get detailed scores, feedback, and visual charts for every interview session.',
    color: '#10b981',
  },
  {
    icon: <Shield size={24} />,
    title: 'Secure & Private',
    desc: 'Your data is protected with JWT authentication and encrypted storage.',
    color: '#8b5cf6',
  },
  {
    icon: <Zap size={24} />,
    title: 'Real-Time Feedback',
    desc: 'Receive instant AI evaluation on technical accuracy, clarity, and confidence.',
    color: '#ef4444',
  },
];

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up with email and get 3 free interview credits instantly.' },
  { step: '02', title: 'Upload Resume', desc: 'Upload your PDF resume and select your target job role.' },
  { step: '03', title: 'Start Interview', desc: 'Answer AI-generated questions by voice or typing.' },
  { step: '04', title: 'Get Feedback', desc: 'Review your performance report with scores and improvement tips.' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Software Engineer', text: 'Landed my dream job after practicing 10 sessions here. The AI feedback was incredibly accurate!', stars: 5 },
  { name: 'Rahul M.', role: 'Data Analyst', text: 'The personalized questions based on my resume made it feel like a real interview. Absolutely loved it!', stars: 5 },
  { name: 'Aditya K.', role: 'Full Stack Developer', text: 'Best interview prep tool I have used. The instant scoring helped me improve rapidly.', stars: 5 },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-grid" />
        </div>
        <div className="container">
          <div className="hero-content animate-fade-in">
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>Powered by Google Gemini AI</span>
            </div>
            <h1 className="hero-title">
              Ace Your Next Interview with{' '}
              <span className="text-gradient">AI-Powered</span>{' '}
              Mock Sessions
            </h1>
            <p className="hero-subtitle">
              Practice real technical interviews with personalized AI questions, 
              voice-based responses, and instant performance feedback. Land your dream job with confidence.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Start Free — 3 Credits <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
            <div className="hero-stats">
              {[
                { val: '10K+', label: 'Interviews' },
                { val: '95%', label: 'Satisfaction' },
                { val: '50+', label: 'Job Roles' },
              ].map((s) => (
                <div key={s.label} className="hero-stat">
                  <span className="hero-stat-val">{s.val}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need to Succeed</h2>
            <p className="section-subtitle">
              A complete interview preparation platform built with cutting-edge AI technology.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card card">
                <div
                  className="feature-icon"
                  style={{
                    background: `${f.color}20`,
                    border: `1px solid ${f.color}40`,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in minutes and practice like a pro.</p>
          </div>
          <div className="steps-grid">
            {steps.map((s, i) => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">Loved by Job Seekers</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card card-glow">
                <div className="testimonial-stars">
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-orb" />
            <div className="cta-content">
              <h2 className="cta-title">Ready to Ace Your Interview?</h2>
              <p className="cta-subtitle">
                Join thousands of candidates who have improved their interview skills with AI-Interviewer.
              </p>
              <div className="cta-checks">
                {['3 free interview credits', 'No credit card required', 'Instant AI feedback'].map(item => (
                  <div key={item} className="cta-check">
                    <CheckCircle size={16} color="#10b981" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              {!user && (
                <Link to="/signup" className="btn btn-primary btn-lg">
                  Get Started Free <ChevronRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-logo">
              <Brain size={20} />
              <span>AI-Interviewer</span>
            </div>
            <p className="footer-copy">© 2024 AI-Interviewer. Built with MERN Stack + Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
