import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Smartphone, Shield, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { deviceFingerprintService } from '@/services/security/deviceFingerprint';

export const DeviceVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { verifyDevice, isDeviceVerified, isLoading, error, clearError, token } = useAuthStore();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [deviceSummary, setDeviceSummary] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isDeviceVerified) {
      navigate('/');
    }
  }, [isDeviceVerified, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    deviceFingerprintService.getDeviceSummary().then(setDeviceSummary);
  }, []);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    try {
      await verifyDevice(fullCode);
    } catch {
      // Error handled by store
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    // TODO: Implement resend API call
    setResendCooldown(60);
  };

  const isCodeComplete = code.every(c => c !== '');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 border border-primary-500/20 mb-6"
          >
            <Smartphone size={40} className="text-primary-500" />
          </motion.div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">Verify Your Device</h1>
          <p className="text-text-secondary">
            We've detected a new device. Enter the verification code sent to your email.
          </p>
        </div>

        {/* Device info */}
        {deviceSummary && (
          <div className="mb-6 p-4 rounded-xl bg-surface border border-surface-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <Shield size={18} className="text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Detected Device</p>
                <p className="text-xs text-text-muted">{deviceSummary}</p>
              </div>
            </div>
          </div>
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

        <form onSubmit={handleSubmit}>
          {/* Code inputs */}
          <div className="flex justify-center gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={clsx(
                  'w-12 h-14 text-center text-xl font-bold rounded-xl',
                  'bg-surface border-2 border-surface-border',
                  'text-text-primary',
                  'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  'transition-all duration-200'
                )}
              />
            ))}
          </div>

          {/* Resend code */}
          <div className="text-center mb-6">
            <p className="text-sm text-text-muted mb-2">Didn't receive a code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={clsx(
                'text-sm font-medium transition-colors',
                resendCooldown > 0
                  ? 'text-text-muted cursor-not-allowed'
                  : 'text-primary-500 hover:text-primary-400'
              )}
            >
              {resendCooldown > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Resend in {resendCooldown}s
                </span>
              ) : (
                'Resend Code'
              )}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            disabled={!isCodeComplete}
            rightIcon={<ArrowRight size={18} />}
          >
            Verify Device
          </Button>
        </form>

        {/* Info notice */}
        <div className="mt-8 p-4 rounded-xl bg-surface border border-surface-border">
          <h3 className="text-sm font-medium text-text-primary mb-2">Why device verification?</h3>
          <ul className="space-y-2 text-xs text-text-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Protects your account from unauthorized access
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Ensures only one device can access at a time
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Helps protect video content from unauthorized sharing
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

