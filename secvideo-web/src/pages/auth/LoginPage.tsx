import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Mail, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isDeviceVerified, isLoading, error, clearError } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const expired = searchParams.get('expired') === 'true';

  useEffect(() => {
    if (isAuthenticated) {
      if (isDeviceVerified) {
        navigate('/');
      } else {
        navigate('/device-verify');
      }
    }
  }, [isAuthenticated, isDeviceVerified, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      // Navigation handled by useEffect
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-background via-background-secondary to-surface overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse animation-delay-500" />
          <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center shadow-glow">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Sec<span className="text-primary-500">Video</span>
              </h1>
              <p className="text-sm text-text-muted">Secure Learning Platform</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-text-primary leading-tight mb-6">
              Learn Without
              <br />
              <span className="text-gradient">Interruption</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-md">
              Experience secure video learning with enterprise-grade protection. 
              Your content, protected.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 space-y-4"
          >
            {[
              'Single device authentication',
              'Anti-recording protection',
              'Dynamic watermarking',
              'Session management',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Shield size={14} className="text-primary-500" />
                </div>
                <span className="text-text-secondary">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-primary">
              Sec<span className="text-primary-500">Video</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary">Sign in to continue learning</p>
          </div>

          {/* Session expired warning */}
          {expired && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-accent-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-amber">Session Expired</p>
                <p className="text-xs text-text-muted mt-1">
                  Your session has expired. Please sign in again.
                </p>
              </div>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-accent-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-red">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={18} />}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-surface-border text-primary-500 focus:ring-primary-500 focus:ring-offset-0 bg-surface"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Sign In
            </Button>
          </form>

          {/* Security notice */}
          <div className="mt-8 p-4 rounded-xl bg-surface border border-surface-border">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">Secure Login</p>
                <p className="text-xs text-text-muted mt-1">
                  Your device will be verified for security. You can only access from one device.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-text-muted">New to SecVideo?</span>
            </div>
          </div>

          <Link to="/register">
            <Button variant="secondary" size="lg" fullWidth>
              Create Account
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

