import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import NBButton from '../components/ui/NBButton';
import NBInput from '../components/ui/NBInput';
import NBCard from '../components/ui/NBCard';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nb-page flex min-h-screen">

      {/* ─── Left branding panel ─── */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12"
        style={{ background: 'var(--nb-black)', borderRight: 'var(--nb-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--nb-yellow)', border: '2px solid white' }}>
            <Zap size={20} style={{ color: 'var(--nb-black)' }} fill="var(--nb-black)" />
          </div>
          <span className="text-xl font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            TransferX
          </span>
        </div>

        {/* Quote */}
        <div>
          <blockquote
            className="text-3xl font-extrabold text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            "Transfer files the way they were{' '}
            <span style={{ background: 'var(--nb-yellow)', color: 'var(--nb-black)', padding: '0 4px' }}>
              meant to be.
            </span>"
          </blockquote>
          <p className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
            Instant P2P · Secure Cloud Share · Auto-expiry
          </p>
        </div>

        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>© 2026 TransferX</p>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12" style={{ background: 'var(--nb-bg)' }}>
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 flex items-center justify-center" style={{ background: 'var(--nb-black)' }}>
            <Zap size={16} style={{ color: 'var(--nb-yellow)' }} fill="var(--nb-yellow)" />
          </div>
          <span className="font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>TransferX</span>
        </div>

        <NBCard className="w-full max-w-md">
          {/* Card header */}
          <div className="nb-card-header-black">
            <h1 className="font-bold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome Back
            </h1>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
              Sign in to your account to continue.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* Email */}
              <div>
                <label className="nb-label flex items-center gap-1.5">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`nb-input ${errors.email ? 'nb-input-error' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-bold flex items-center gap-1" style={{ color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)' }}>
                    <AlertCircle size={11} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="nb-label mb-0 flex items-center gap-1.5">
                    <Lock size={12} /> Password
                  </label>
                  <a href="#" className="text-xs font-bold underline" style={{ fontFamily: 'var(--font-mono)', color: 'var(--nb-blue)' }}>
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Your password"
                    className={`nb-input pr-12 ${errors.password ? 'nb-input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-bold flex items-center gap-1" style={{ color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)' }}>
                    <AlertCircle size={11} /> {errors.password}
                  </p>
                )}
              </div>

              <NBButton type="submit" variant="primary" loading={loading} className="w-full mt-1">
                Sign In
              </NBButton>
            </form>

            {/* Divider */}
            <div className="nb-divider text-xs font-bold my-5" style={{ fontFamily: 'var(--font-mono)' }}>OR</div>

            <p className="text-center text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              No account?{' '}
              <Link to="/register" className="font-bold underline" style={{ color: 'var(--nb-black)' }}>
                Create one free →
              </Link>
            </p>
          </div>
        </NBCard>
      </div>
    </div>
  );
};

export default LoginPage;
