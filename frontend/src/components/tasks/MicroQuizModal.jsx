import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, HelpCircle, Zap, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { createTaskQuiz, answerQuiz } from '../../api/insights';

/**
 * MicroQuizModal Component
 * Non-blocking 1-question micro-quiz triggered after a daily task is marked done.
 */
export const MicroQuizModal = ({ isOpen, onClose, taskId, taskTitle, onQuizAnswered }) => {
  const queryClient = useQueryClient();
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null); // { id, question, options[], topic }
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null); // { id, is_correct, score, correct_index }

  useEffect(() => {
    if (!isOpen || !taskId) return;

    let isMounted = true;
    const fetchQuiz = async () => {
      try {
        setIsLoadingQuiz(true);
        setQuizData(null);
        setSelectedIndex(null);
        setEvalResult(null);

        const res = await createTaskQuiz(taskId);
        if (isMounted) {
          if (!res || !res.question) {
            onClose();
          } else {
            setQuizData(res);
          }
        }
      } catch (err) {
        if (isMounted) {
          // Fail silently on quiz creation error as per specs
          const detail = err?.response?.data?.detail;
          if (detail) {
            showToast(detail, 'info');
          }
          onClose();
        }
      } finally {
        if (isMounted) setIsLoadingQuiz(false);
      }
    };

    fetchQuiz();
    return () => { isMounted = false; };
  }, [isOpen, taskId, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quizData || selectedIndex === null || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await answerQuiz(quizData.id, selectedIndex);
      setEvalResult(res);

      if (res?.is_correct) {
        showToast('+5 XP Earned on Micro-Quiz!', 'success');
        queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
        queryClient.invalidateQueries({ queryKey: ['insights', 'weekly'] });
      }

      if (onQuizAnswered) {
        onQuizAnswered(res);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to submit quiz answer.';
      showToast(detail, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Check (Optional)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Task Title Header */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Completed Mission Task:
          </div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
            {taskTitle || 'Daily Task'}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingQuiz ? (
          <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Spinner size="lg" color="var(--accent)" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Preparing post-task retention question...
            </span>
          </div>
        ) : quizData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Question Header */}
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Topic: {(quizData.topic || 'DSA').toUpperCase()}
              </div>
              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                "{quizData.question}"
              </h4>
            </div>

            {/* Evaluation Result Banner */}
            {evalResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: evalResult.is_correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${evalResult.is_correct ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {evalResult.is_correct ? (
                    <CheckCircle2 size={20} color="var(--success)" flexShrink={0} />
                  ) : (
                    <AlertCircle size={20} color="var(--text-danger)" flexShrink={0} />
                  )}
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: evalResult.is_correct ? 'var(--success)' : 'var(--text-danger)' }}>
                      {evalResult.is_correct ? 'Correct! (+5 XP)' : 'Not quite right'}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {evalResult.is_correct
                        ? 'Spot-on response! Your concepts are solid.'
                        : `Correct option: "${quizData.options[evalResult.correct_index]}"`}
                    </div>
                  </div>
                </div>

                <Button variant="primary" size="sm" onClick={onClose} style={{ alignSelf: 'flex-end' }}>
                  Close & Continue
                </Button>
              </div>
            ) : (
              /* Options Radio Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {quizData.options.map((opt, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-lg)',
                          background: isSelected ? 'var(--accent-dim)' : 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          cursor: 'pointer',
                          transition: 'all var(--t-fast)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-tertiary)'}`,
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0C0E11' }} />}
                        </div>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                          {opt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                    Skip Quiz
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    disabled={selectedIndex === null}
                  >
                    Submit Option
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
