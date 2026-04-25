import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../services/api';
import {
  Coins, Zap, Crown, Star, CheckCircle, ArrowLeft,
  Shield, CreditCard, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Payment.css';

// Load Razorpay script dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PACKAGE_META = {
  starter: {
    icon: <Zap size={28} />,
    color: '#06b6d4',
    badge: null,
    features: ['5 AI Interview sessions', 'Voice + Text input', 'Performance reports', 'Score breakdown'],
  },
  popular: {
    icon: <Star size={28} />,
    color: '#6366f1',
    badge: 'Most Popular',
    features: ['15 AI Interview sessions', 'Voice + Text input', 'Performance reports', 'Score breakdown', 'Priority AI responses'],
  },
  pro: {
    icon: <Crown size={28} />,
    color: '#f59e0b',
    badge: 'Best Value',
    features: ['30 AI Interview sessions', 'Voice + Text input', 'Detailed analytics', 'Score breakdown', 'Priority AI responses', 'All job roles'],
  },
};

const STEPS = ['Initiating payment...', 'Processing transaction...', 'Adding credits to account...'];

const Payment = () => {
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    paymentAPI
      .getPackages()
      .then((res) => setPackages(res.data.packages))
      .catch(() => toast.error('Failed to load packages'))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (packageId) => {
    setPaying(packageId);
    setProcessingStep(1);
    try {
      // Step 1: Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check internet connection.');
        return;
      }

      setProcessingStep(2);

      // Step 2: Create order on backend
      const orderRes = await paymentAPI.createOrder(packageId);
      const { orderId, amount, currency, keyId, package: pkg, user: userInfo } = orderRes.data;

      // Step 3: Open Razorpay checkout popup
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'AI-Interviewer',
        description: `${pkg.label} — Interview Credits`,
        order_id: orderId,
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setPaying(null);
            setProcessingStep(0);
          },
        },
        handler: async (response) => {
          setProcessingStep(3);
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId,
            });
            await new Promise((r) => setTimeout(r, 600));
            updateCredits(verifyRes.data.credits);
            toast.success(`🎉 ${verifyRes.data.message}`);
            navigate('/dashboard');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaying(null);
            setProcessingStep(0);
          }
        },
      };

      // Hide overlay while Razorpay popup is open
      setPaying(null);
      setProcessingStep(0);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setPaying(null);
      setProcessingStep(0);
    }
  };

  const formatPrice = (paise) => `₹${(paise / 100).toFixed(0)}`;

  return (
    <div className="page">
      {/* Processing Overlay */}
      {paying && (
        <div className="processing-overlay">
          <div className="processing-card">
            <div className="processing-icon">
              {processingStep === 3
                ? <CheckCircle size={44} color="#10b981" />
                : <div className="spinner" />}
            </div>
            <h3>{processingStep === 3 ? 'Payment Successful!' : 'Processing Payment'}</h3>
            <div className="processing-steps">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`processing-step ${
                    processingStep > i + 1 ? 'step-done' :
                    processingStep === i + 1 ? 'step-active' : 'step-pending'
                  }`}
                >
                  <div className="step-dot" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container page-content">
        {/* Header */}
        <div className="payment-header animate-fade-in">
          <button
            className="back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="payment-hero">
            <div className="payment-hero-icon">
              <Sparkles size={28} />
            </div>
            <h1>Buy Interview Credits</h1>
            <p>
              Get more credits to continue practicing with AI-powered mock interviews.
              Each credit = 1 complete interview session.
            </p>
            <div className="current-credits-badge">
              <Coins size={16} />
              You currently have <strong>{user?.credits} credit{user?.credits !== 1 ? 's' : ''}</strong>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="packages-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 420, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div className="packages-grid animate-fade-in">
            {Object.entries(packages).map(([packageId, pkg]) => {
              const meta = PACKAGE_META[packageId];
              const isPopular = packageId === 'popular';
              return (
                <div
                  key={packageId}
                  className={`package-card ${isPopular ? 'package-featured' : ''}`}
                  style={{ '--pkg-color': meta.color }}
                >
                  {meta.badge && (
                    <div className="package-badge" style={{ background: meta.color }}>
                      {meta.badge}
                    </div>
                  )}

                  <div className="package-icon" style={{ background: `${meta.color}20`, color: meta.color }}>
                    {meta.icon}
                  </div>

                  <div className="package-credits">
                    <span className="credit-num">{pkg.credits}</span>
                    <span className="credit-word">Credits</span>
                  </div>

                  <div className="package-price">
                    <span className="price-amount">{formatPrice(pkg.amount)}</span>
                    <span className="price-per">/ {pkg.credits} interviews</span>
                  </div>

                  <div className="price-per-credit">
                    ≈ {formatPrice(Math.round(pkg.amount / pkg.credits))} per interview
                  </div>

                  <div className="package-divider" />

                  <ul className="package-features">
                    {meta.features.map((f) => (
                      <li key={f}>
                        <CheckCircle size={14} color={meta.color} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`btn package-buy-btn ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleBuy(packageId)}
                    disabled={paying !== null}
                    id={`buy-${packageId}-btn`}
                    style={isPopular ? {} : { borderColor: meta.color, color: meta.color }}
                  >
                    {paying === packageId ? (
                      <>
                        <div className="spinner spinner-sm" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Buy Now — {formatPrice(pkg.amount)}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Badges */}
        <div className="trust-section animate-fade-in">
          <div className="trust-item">
            <Shield size={18} color="#10b981" />
            <span>100% Secure Payments via Razorpay</span>
          </div>
          <div className="trust-item">
            <CheckCircle size={18} color="#6366f1" />
            <span>Credits added instantly after payment</span>
          </div>
          <div className="trust-item">
            <Coins size={18} color="#f59e0b" />
            <span>Credits never expire</span>
          </div>
        </div>

        {/* Test Mode Notice */}
        <div className="test-notice">
          <p>
            🧪 <strong>Test Mode (rzp_test):</strong> Use card <code>4111 1111 1111 1111</code>,
            any future expiry, CVV <code>123</code>, OTP <code>1234</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
