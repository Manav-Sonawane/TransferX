import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
];

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!form.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

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
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Account created! Welcome to TransferX 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      const fieldErrors = err?.response?.data?.errors;
      if (fieldErrors) {
        const errs = {};
        fieldErrors.forEach(({ field, message }) => { errs[field] = message; });
        setErrors(errs);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-900 to-surface-950 border-r border-surface-800 p-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary-500/5 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-blue">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-white">TransferX</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl font-heading font-bold text-white leading-snug">
            Join thousands who share
            <br />
            <span className="gradient-text">files the smarter way.</span>
          </h2>
          <ul className="space-y-3 text-sm text-surface-400">
            {[
              'Instant P2P transfers — no server storage',
              'Secure cloud sharing with expiry dates',
              'Password-protect your shared files',
              'Download analytics & management',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-success-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-surface-600">© 2026 TransferX. All rights reserved.</p>
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
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Create account</h1>
            <p className="text-surface-400">Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

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
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
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

              {/* Password requirements */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => (
                    <p
                      key={req.label}
                      className={`text-xs flex items-center gap-1.5 ${
                        req.test(form.password) ? 'text-success-500' : 'text-surface-500'
                      }`}
                    >
                      <CheckCircle size={11} />
                      {req.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-danger-500 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-surface-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-primary-400 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-primary-400 hover:underline">Privacy Policy</a>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
