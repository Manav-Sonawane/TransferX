import { Link } from 'react-router-dom';
import { Zap, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-8xl font-heading font-bold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-heading font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-surface-400 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary btn-lg inline-flex">
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
