import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { HelpCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { Quiz } from '@/types';

interface QuizOverlayProps {
  quiz: Quiz;
  onAnswer: (isCorrect: boolean, selectedIndex: number) => void;
  onSkip?: () => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({
  quiz,
  onAnswer,
  onSkip,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    
    const correct = selectedIndex === quiz.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);

    // Auto-continue after showing result
    setTimeout(() => {
      onAnswer(correct, selectedIndex);
    }, 2000);
  };

  const handleOptionClick = (index: number) => {
    if (showResult) return;
    setSelectedIndex(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg mx-4 p-6 bg-surface rounded-2xl border border-surface-border shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary-500/20">
            <HelpCircle size={24} className="text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Quick Quiz</h3>
            <p className="text-sm text-text-muted">Test your understanding</p>
          </div>
        </div>

        {/* Question */}
        <p className="text-text-primary font-medium mb-6">{quiz.question}</p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {quiz.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === quiz.correctIndex;
            
            let optionStyle = 'border-surface-border hover:border-primary-500/50 hover:bg-surface-light';
            
            if (showResult) {
              if (isCorrectOption) {
                optionStyle = 'border-accent-emerald bg-accent-emerald/10';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-accent-red bg-accent-red/10';
              }
            } else if (isSelected) {
              optionStyle = 'border-primary-500 bg-primary-500/10';
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showResult}
                className={clsx(
                  'w-full flex items-center gap-3 p-4 rounded-xl border-2',
                  'text-left transition-all duration-200',
                  optionStyle,
                  showResult && 'cursor-default'
                )}
              >
                {/* Option letter */}
                <div
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                    showResult && isCorrectOption
                      ? 'bg-accent-emerald text-white'
                      : showResult && isSelected && !isCorrectOption
                      ? 'bg-accent-red text-white'
                      : isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-light text-text-muted'
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </div>

                {/* Option text */}
                <span
                  className={clsx(
                    'flex-1',
                    showResult && isCorrectOption
                      ? 'text-accent-emerald'
                      : showResult && isSelected && !isCorrectOption
                      ? 'text-accent-red'
                      : 'text-text-primary'
                  )}
                >
                  {option}
                </span>

                {/* Result icon */}
                {showResult && isCorrectOption && (
                  <CheckCircle size={20} className="text-accent-emerald flex-shrink-0" />
                )}
                {showResult && isSelected && !isCorrectOption && (
                  <XCircle size={20} className="text-accent-red flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result message */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'p-4 rounded-xl mb-6',
              isCorrect ? 'bg-accent-emerald/10' : 'bg-accent-amber/10'
            )}
          >
            <p
              className={clsx(
                'font-medium',
                isCorrect ? 'text-accent-emerald' : 'text-accent-amber'
              )}
            >
              {isCorrect ? '🎉 Correct!' : '💡 Not quite right'}
            </p>
            {quiz.explanation && (
              <p className="text-sm text-text-secondary mt-1">{quiz.explanation}</p>
            )}
            <p className="text-xs text-text-muted mt-2">Continuing in a moment...</p>
          </motion.div>
        )}

        {/* Actions */}
        {!showResult && (
          <div className="flex items-center gap-3">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={selectedIndex === null}
              fullWidth={!onSkip}
              rightIcon={<ArrowRight size={18} />}
            >
              Submit Answer
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

