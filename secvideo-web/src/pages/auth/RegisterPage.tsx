import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Shield,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { api } from '@/services/api/apiClient';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const failedRequirements = passwordRequirements.filter((r) => !r.test(formData.password));
    if (failedRequirements.length > 0) {
      setError('Please meet all password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(
        err?.response?.data?.message ||
          'Registration failed. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-surface p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-surface border border-surface-border rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={40} className="text-accent-green" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Registration Successful!</h2>
            <p className="text-text-secondary mb-6">
              Your account has been created. Redirecting you to login...
            </p>
            <div className="flex justify-center">
              <Loader2 size={24} className="text-primary-500 animate-spin" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-surface p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
            <Shield size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">SecVideo</h1>
            <p className="text-xs text-text-muted">Secure Learning Platform</p>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-surface border border-surface-border rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
            <p className="text-text-secondary mt-2">Join our secure learning platform</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-sm text-accent-red"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={clsx(
                    'w-full h-12 pl-12 pr-4 rounded-xl',
                    'bg-surface-light border border-surface-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                  )}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={clsx(
                    'w-full h-12 pl-12 pr-4 rounded-xl',
                    'bg-surface-light border border-surface-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={clsx(
                    'w-full h-12 pl-12 pr-12 rounded-xl',
                    'bg-surface-light border border-surface-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1"
                >
                  {passwordRequirements.map((req, index) => {
                    const passed = req.test(formData.password);
                    return (
                      <div
                        key={index}
                        className={clsx(
                          'flex items-center gap-2 text-xs',
                          passed ? 'text-accent-green' : 'text-text-muted'
                        )}
                      >
                        <CheckCircle size={12} />
                        <span>{req.label}</span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={clsx(
                    'w-full h-12 pl-12 pr-12 rounded-xl',
                    'bg-surface-light border border-surface-border',
                    'text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    'transition-all duration-200',
                    formData.confirmPassword &&
                      formData.password !== formData.confirmPassword &&
                      'border-accent-red focus:border-accent-red focus:ring-accent-red/20'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-accent-red">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
            >
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-text-muted">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
          <br />
          Your device will be registered for secure access.
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

