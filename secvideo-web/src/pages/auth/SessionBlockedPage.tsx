import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldOff, ArrowRight, HelpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';

export const SessionBlockedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout } = useAuthStore();
  
  const reason = searchParams.get('reason') || 'Your session has been terminated.';

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-accent-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-accent-amber/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
          className="inline-flex p-5 rounded-2xl bg-accent-red/10 border border-accent-red/20 mb-8"
        >
          <ShieldOff size={48} className="text-accent-red" />
        </motion.div>

        <h1 className="text-3xl font-bold text-text-primary mb-4">Session Blocked</h1>
        
        <div className="p-4 rounded-xl bg-surface border border-surface-border mb-6">
          <p className="text-text-secondary">{reason}</p>
        </div>

        {/* Possible reasons */}
        <div className="text-left mb-8 p-4 rounded-xl bg-surface border border-surface-border">
          <h3 className="text-sm font-medium text-text-primary mb-3">This may have happened because:</h3>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber mt-2 flex-shrink-0" />
              You logged in from another device or browser
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber mt-2 flex-shrink-0" />
              Your session expired due to inactivity
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber mt-2 flex-shrink-0" />
              A security violation was detected
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber mt-2 flex-shrink-0" />
              An administrator terminated your session
            </li>
          </ul>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleBackToLogin}
          rightIcon={<ArrowRight size={18} />}
        >
          Back to Login
        </Button>

        {/* Help links */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
            <HelpCircle size={16} />
            Get Help
          </button>
          <button className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors">
            <Mail size={16} />
            Contact Support
          </button>
        </div>
      </motion.div>
    </div>
  );
};

