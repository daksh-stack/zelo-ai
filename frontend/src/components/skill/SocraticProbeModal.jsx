import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, X, Sparkles, Send, Lightbulb } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { startUnderstandingProbe, evaluateUnderstanding } from '../../api/skillPath';

/**
 * SocraticProbeModal Component
 * Optional modal triggered from daily task cards to test conceptual understanding with 1-2 probes
 */
export const SocraticProbeModal = ({ isOpen, onClose, taskTitle, taskDescription }) => {
  const [isLoadingProbes, setIsLoadingProbes] = useState(false);
  const [probes, setProbes] = useState([]);
  const [currentProbeIndex, setCurrentProbeIndex] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null); // { ok, feedback }
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskTitle) return;

    let isMounted = true;
    const fetchProbes = async () => {
      try {
        setIsLoadingProbes(true);
        setProbes([]);
        setCurrentProbeIndex(0);
        setUserAnswer('');
        setEvalResult(null);
        setShowHint(false);

        const payload = { topic_title: taskTitle };
        if (taskDescription) {
          payload.notes_summary = taskDescription;
        }

        const res = await startUnderstandingProbe(payload);
        if (isMounted) {
          const probeList = res?.probes || [];
          if (probeList.length === 0) {
            showToast('No probes generated for this task.', 'info');
            onClose();
          } else {
            setProbes(probeList);
          }
        }
      } catch (err) {
        if (isMounted) {
          showToast(err?.response?.data?.detail || 'Failed to start understanding probe.', 'error');
          onClose();
        }
      } finally {
        if (isMounted) setIsLoadingProbes(false);
      }
    };

    fetchProbes();
    return () => { isMounted = false; };
  }, [isOpen, taskTitle, taskDescription, onClose]);

  if (!isOpen) return null;

  const currentProbe = probes[currentProbeIndex];

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!currentProbe || !userAnswer.trim() || isEvaluating) return;

    try {
      setIsEvaluating(true);
      const res = await evaluateUnderstanding({
        question: currentProbe.question,
        user_answer: userAnswer.trim(),
      });
      setEvalResult(res);
      if (res?.ok) {
        showToast('Great understanding demonstrated!', 'success');
      }
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Failed to evaluate answer.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextProbe = () => {
    if (currentProbeIndex < probes.length - 1) {
      setCurrentProbeIndex((prev) => prev + 1);
      setUserAnswer('');
      setEvalResult(null);
      setShowHint(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Your Understanding">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header Task Label */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Mission Topic:
          </div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
            {taskTitle}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProbes ? (
          <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Spinner size="lg" color="var(--accent)" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Constructing Socratic understanding probe...
            </span>
          </div>
        ) : currentProbe ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Probe Question */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Probe {currentProbeIndex + 1} of {probes.length}
                </span>
                {currentProbe.hint && (
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Lightbulb size={13} />
                    <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                  </button>
                )}
              </div>

              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                "{currentProbe.question}"
              </h4>

              {showHint && currentProbe.hint && (
                <div style={{ marginTop: '8px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
                  💡 <strong>Hint:</strong> {currentProbe.hint}
                </div>
              )}
            </div>

            {/* Evaluation Result */}
            {evalResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: evalResult.ok ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${evalResult.ok ? 'var(--success-border)' : 'var(--danger-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: evalResult.ok ? 'var(--success)' : 'var(--text-danger)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    {evalResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{evalResult.ok ? 'Understanding Validated' : 'Needs Refinement'}</span>
                  </div>

                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {evalResult.feedback}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {currentProbeIndex < probes.length - 1 ? (
                    <Button variant="primary" size="sm" onClick={handleNextProbe}>
                      Next Probe →
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={onClose}>
                      Done & Close
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* User Answer Form */
              <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <textarea
                  rows={4}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Explain your understanding in 1-2 crisp sentences..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.45,
                    resize: 'vertical',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                    Skip / Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isEvaluating}
                    disabled={!userAnswer.trim()}
                  >
                    Evaluate Answer
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
