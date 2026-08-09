import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/router/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AccessPage from './pages/AccessPage';
import DownloadPage from './pages/DownloadPage';
import P2PPage from './pages/P2PPage';
import SessionPage from './pages/SessionPage';
import NotFoundPage from './pages/NotFoundPage';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:   '#FFFFFF',
              color:        '#0A0A0A',
              border:       '3px solid #0A0A0A',
              borderRadius: '0px',
              boxShadow:    '5px 5px 0 #0A0A0A',
              fontSize:     '13px',
              fontFamily:   '"Space Grotesk", sans-serif',
              fontWeight:   '600',
              padding:      '12px 16px',
            },
            success: { iconTheme: { primary: '#5CB85C', secondary: '#FFFFFF' } },
            error:   { iconTheme: { primary: '#FF6B6B', secondary: '#FFFFFF' } },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes — redirect if logged in */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          <Route path="/upload" element={<UploadPage />} />
          <Route path="/access" element={<AccessPage />} />
          <Route path="/share/:code" element={<DownloadPage />} />
          
          <Route path="/p2p" element={<P2PPage />} />
          <Route path="/p2p/:sessionCode" element={<SessionPage />} />
          {/* Protected Routes — require auth */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
