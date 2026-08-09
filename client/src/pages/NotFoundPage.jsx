import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import NBButton from '../components/ui/NBButton';
import NBCard from '../components/ui/NBCard';

const NotFoundPage = () => (
  <div className="nb-page min-h-screen flex items-center justify-center px-4">
    <NBCard className="text-center max-w-sm w-full">
      {/* Header */}
      <div className="nb-card-header-black">
        <span className="text-xs font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-mono)' }}>
          Error 404
        </span>
      </div>

      <div className="p-8">
        {/* Big 404 */}
        <div
          className="text-8xl font-extrabold mb-2 leading-none"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--nb-black)' }}
        >
          404
        </div>

        {/* Yellow underline bar */}
        <div className="h-3 mb-6" style={{ background: 'var(--nb-yellow)', border: 'var(--nb-border-thin)' }} />

        <h1 className="text-xl font-bold uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Page Not Found
        </h1>
        <p className="text-sm mb-6" style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/">
          <NBButton variant="primary" className="w-full">
            <Home size={16} /> Back to Home
          </NBButton>
        </Link>
      </div>
    </NBCard>
  </div>
);

export default NotFoundPage;
