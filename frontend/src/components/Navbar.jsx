import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, LayoutDashboard, History, LogOut, Menu, X, Coins, ChevronDown, Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('ai_theme') === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('ai_theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  const toggleTheme = () => setIsLight((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/history', label: 'History', icon: <History size={16} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to={user ? '/dashboard' : '/'} className="navbar-logo">
          <div className="navbar-logo-icon">
            <Brain size={20} />
          </div>
          <span className="navbar-logo-text">AI-<span>Interviewer</span></span>
        </Link>

        {/* Desktop Nav */}
        {user && (
          <div className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${isActive(link.to) ? 'active' : ''}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right Side */}
        <div className="navbar-right">
          {user ? (
            <>
              {/* Credits Badge */}
              <div className="credits-badge">
                <Coins size={14} />
                <span>{user.credits} Credits</span>
              </div>

              {/* User Dropdown */}
              <div className="user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={dropdownOpen ? 'rotated' : ''} />

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-info">
                      <p className="dropdown-name">{user.name}</p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="navbar-auth-btns">
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && user && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button className="mobile-link danger" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
