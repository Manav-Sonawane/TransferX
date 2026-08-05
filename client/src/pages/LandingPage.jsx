import { Link } from 'react-router-dom';
import { Zap, Shield, Users, ArrowRight, Upload, Share2, Download } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant P2P Transfer',
    desc: 'Transfer files directly between browsers using WebRTC. No server storage, no wait times.',
    color: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
  },
  {
    icon: Shield,
    title: 'Secure Cloud Share',
    desc: 'Upload once, share with a code. Password protection, download limits, auto-expiry.',
    color: 'text-secondary-400',
    bg: 'bg-secondary-500/10',
    border: 'border-secondary-500/20',
  },
  {
    icon: Users,
    title: 'Multi-Participant',
    desc: 'Multiple users can join a single P2P session and receive files simultaneously.',
    color: 'text-success-500',
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
  },
];

const steps = [
  { icon: Upload, label: 'Upload or Start Session', color: 'text-primary-400' },
  { icon: Share2, label: 'Generate Share Code', color: 'text-secondary-400' },
  { icon: Download, label: 'Receiver Downloads', color: 'text-success-500' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface-950 overflow-hidden">

      {/* ─── Navbar ─────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-blue">
              <Zap className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-heading font-bold text-lg text-white">TransferX</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-surface-400">
            <a href="#features" className="hover:text-surface-100 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-surface-100 transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Login</Link>
            <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────── */}
      <section className="pt-40 pb-24 relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary-500/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-secondary-500/5 blur-3xl" />
        </div>

        <div className="page-container relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-blue mb-8 text-sm py-1.5 px-4">
            <Zap size={12} className="text-primary-400" />
            <span>Hybrid File Sharing Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
            Transfer Files
            <br />
            <span className="gradient-text">Instantly & Securely</span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Choose between blazing-fast P2P transfers or encrypted cloud sharing with passwords,
            expiry dates, and download limits — all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/p2p" className="btn-primary btn-lg group w-full sm:w-auto">
              <Zap size={18} />
              Start P2P Transfer
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/upload" className="btn-outline btn-lg w-full sm:w-auto">
              <Upload size={18} />
              Secure Upload
            </Link>
          </div>

          {/* Access code bar */}
          <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
            <input
              type="text"
              placeholder="Enter share code..."
              className="input text-center tracking-widest font-mono text-base flex-1"
            />
            <button className="btn-secondary px-5 py-3 rounded-xl">
              <Download size={18} />
              Access
            </button>
          </div>
          <p className="text-xs text-surface-600 mt-3">Enter a share code to access a file</p>
        </div>
      </section>

      {/* ─── Features ───────────────────────────── */}
      <section id="features" className="section border-t border-surface-800/60">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-surface-400 max-w-xl mx-auto">
              Two powerful transfer modes, one seamless experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className={`card-hover p-6 ${f.border} border`}>
                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-heading font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────── */}
      <section id="how-it-works" className="section border-t border-surface-800/60">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-surface-400">Simple. Fast. Secure.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-3 hover:border-primary-500/40 transition-colors">
                    <step.icon size={24} className={step.color} />
                  </div>
                  <p className="text-sm text-surface-300 font-medium max-w-[120px]">{step.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight size={20} className="text-surface-700 mx-4 flex-shrink-0 hidden sm:block mb-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────── */}
      <section className="section border-t border-surface-800/60">
        <div className="page-container">
          <div className="card p-10 sm:p-16 text-center relative overflow-hidden border-primary-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                Ready to transfer smarter?
              </h2>
              <p className="text-surface-400 mb-8 max-w-md mx-auto">
                Create a free account and unlock password protection, analytics, and unlimited uploads.
              </p>
              <Link to="/register" className="btn-primary btn-lg inline-flex group">
                Create Free Account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="border-t border-surface-800/60 py-8">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-surface-400">TransferX</span>
          </div>
          <p>© 2026 TransferX. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-surface-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-surface-300 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
