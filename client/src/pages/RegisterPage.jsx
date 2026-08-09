import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import NBButton from '../components/ui/NBButton';
import NBCard from '../components/ui/NBCard';

const passwordRequirements = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'Contains a number',      test: (p) => /\d/.test(p) },
  { label: 'Contains a letter',      test: (p) => /[a-zA-Z]/.test(p) },
];

const PERKS = [
  'Instant P2P transfers — no server storage',
  'Secure cloud sharing with expiry dates',
  'Password-protect your shared files',
  'Download analytics & management',
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
      await register({ name: form.name.trim(), email: form.email, password: form.password, confirmPassword: form.confirmPassword });
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

  const FieldError = ({ msg }) => msg ? (
    <p className="mt-1 text-xs font-bold flex items-center gap-1" style={{ color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)' }}>
      <AlertCircle size={11} /> {msg}
    </p>
  ) : null;

  const inputCls = (field) => `nb-input ${errors[field] ? 'nb-input-error' : ''}`;

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

        {/* Perks */}
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Join thousands who share files{' '}
            <span style={{ background: 'var(--nb-yellow)', color: 'var(--nb-black)', padding: '0 4px' }}>the smarter way.</span>
          </h2>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--nb-green)', border: '2px solid white' }}>
                  <CheckCircle size={12} color="white" />
                </div>
                <span className="text-sm font-medium text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>© 2026 TransferX. All rights reserved.</p>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12" style={{ background: 'var(--nb-bg)', overflowY: 'auto' }}>
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
              Create Account
            </h1>
          </div>

          <div className="p-6">
            <p className="text-sm mb-5" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              Free forever. No credit card required.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* Name */}
              <div>
                <label htmlFor="name" className="nb-label flex items-center gap-1.5"><User size={12} /> Full Name</label>
                <input id="name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={inputCls('name')} />
                <FieldError msg={errors.name} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="nb-label flex items-center gap-1.5"><Mail size={12} /> Email Address</label>
                <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputCls('email')} />
                <FieldError msg={errors.email} />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="nb-label flex items-center gap-1.5"><Lock size={12} /> Password</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className={`${inputCls('password')} pr-12`} />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label={showPassword ? 'Hide' : 'Show'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError msg={errors.password} />
                {form.password && (
                  <div className="mt-2 flex flex-col gap-1">
                    {passwordRequirements.map((req) => (
                      <p key={req.label} className="text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', color: req.test(form.password) ? 'var(--nb-green)' : '#9ca3af' }}>
                        <CheckCircle size={11} /> {req.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="nb-label flex items-center gap-1.5"><Lock size={12} /> Confirm Password</label>
                <div className="relative">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className={`${inputCls('confirmPassword')} pr-12`} />
                  <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label={showConfirm ? 'Hide' : 'Show'}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError msg={errors.confirmPassword} />
              </div>

              {/* Terms */}
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
                By creating an account, you agree to our{' '}
                <a href="#" className="underline font-bold" style={{ color: 'var(--nb-black)' }}>Terms</a> and{' '}
                <a href="#" className="underline font-bold" style={{ color: 'var(--nb-black)' }}>Privacy Policy</a>.
              </p>

              <NBButton type="submit" variant="primary" loading={loading} className="w-full">
                Create Account
              </NBButton>
            </form>

            <div className="nb-divider text-xs font-bold my-5" style={{ fontFamily: 'var(--font-mono)' }}>OR</div>

            <p className="text-center text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold underline" style={{ color: 'var(--nb-black)' }}>Sign in →</Link>
            </p>
          </div>
        </NBCard>
      </div>
    </div>
  );
};

export default RegisterPage;
