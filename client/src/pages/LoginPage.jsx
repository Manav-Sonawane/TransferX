import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Zap, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 to-surface-950 border-r border-surface-800 p-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-blue">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-white">TransferX</span>
        </div>

        <div className="relative z-10">
          <blockquote className="text-2xl font-heading font-semibold text-white leading-snug mb-4">
            "Transfer files the way they were
            <br />
            <span className="gradient-text">meant to be transferred.</span>"
          </blockquote>
          <p className="text-surface-400 text-sm">Instant P2P • Secure Cloud Share • Auto-expiry</p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-surface-500">
          <span>© 2026 TransferX</span>
          <span>·</span>
          <a href="#" className="hover:text-surface-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-surface-300 transition-colors">Terms</a>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-white">TransferX</span>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Welcome back</h1>
            <p className="text-surface-400">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label mb-0">Password</label>
                <a href="#" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-surface-800" />
            <span className="text-xs text-surface-600">OR</span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
