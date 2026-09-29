import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, ArrowRight, Award, RotateCcw, Home, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

/**
 * InterviewQuestion Component
 * Renders active interview questions, textarea for answer, instant AI evaluation, feedback, model answer, and completion summary.
 */
export const InterviewQuestion = ({ session, onAnswerSubmit, isSubmitting, onResetSession, navigate }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [answeredMap, setAnsweredMap] = useState({}); // { [answer_id]: evalResult }
  const [currentEval, setCurrentEval] = useState(null);

  if (!session || !session.questions) return null;

  const questions = session.questions || [];
  const totalQuestions = session.total_questions || questions.length;

  // Find first unanswered question
  const currentQuestion = questions.find((q) => !answeredMap[q.id]);

  const answeredCount = Object.keys(answeredMap).length;
  const isCompleted = session.status === 'completed' || (!currentQuestion && answeredCount > 0);

  // Compute average score of answered questions so far
  const totalScorePct = Object.values(answeredMap).reduce((acc, curr) => acc + (curr.score || 0), 0);
  const avgScorePct = answeredCount > 0 ? Math.round((totalScorePct / answeredCount) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentQuestion || !userAnswer.trim() || isSubmitting) return;

    const evalResult = await onAnswerSubmit(currentQuestion.id, userAnswer.trim());
    if (evalResult) {
      setAnsweredMap((prev) => ({
        ...prev,
        [currentQuestion.id]: evalResult,
      }));
      setCurrentEval(evalResult);
    }
  };

  const handleNextQuestion = () => {
    setCurrentEval(null);
    setUserAnswer('');
  };

  // Render Completed Summary State
  if (isCompleted) {
    const finalAvg = Math.round(
      (Object.values(answeredMap).reduce((acc, curr) => acc + (curr.score || 0), 0) / Math.max(answeredCount, 1)) * 100
    );

    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card padding="32px" accent glow glowColor="accent">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={32} color="var(--accent)" />
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                Interview Complete
              </div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Mock Session Finished!
              </h2>
            </div>

            {/* Score Ring / Pill */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '16px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: finalAvg >= 75 ? 'var(--success)' : finalAvg >= 50 ? '#F59E0B' : 'var(--accent)' }}>
                  {finalAvg}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Average Interview Score
                </div>
              </div>

              <div style={{ width: '1px', height: '36px', background: 'var(--border)' }} />

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {answeredCount} of {totalQuestions} Answered
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Domain: {(session.domain || 'DSA').toUpperCase()}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: '440px' }}>
              Great practice session! Review your model answers and try another domain to sharpen your readiness.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '400px', marginTop: '8px' }}>
              <Button
                variant="secondary"
                size="md"
                leftIcon={Home}
                onClick={() => navigate('/dashboard')}
                style={{ flex: 1 }}
              >
                Dashboard
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={RotateCcw}
                onClick={onResetSession}
                style={{ flex: 1 }}
              >
                New Interview
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const scorePct = currentEval ? Math.round(currentEval.score * 100) : null;
  const scoreColor = scorePct >= 80 ? 'var(--success)' : scorePct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Session Progress Header */}
      <Card padding="20px" accent glow glowColor="accent">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <MessageSquare size={15} color="var(--accent)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {(session.domain || 'DSA').toUpperCase()} Interview Room
              </span>
            </div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Question {currentQuestion?.order || answeredCount + 1} of {totalQuestions}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {answeredCount > 0 && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Current Avg: </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--accent)' }}>{avgScorePct}%</span>
              </div>
            )}
            <div style={{ width: '90px' }}>
              <ProgressBar progress={Math.round((answeredCount / totalQuestions) * 100)} variant="accent" height="6px" />
            </div>
          </div>
        </div>
      </Card>

      {/* Active Question Card */}
      {currentQuestion && (
        <Card padding="24px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Interviewer Asks:
              </div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
                "{currentQuestion.question}"
              </h2>
            </div>

            {/* Answer Evaluation Result (if submitted) */}
            {currentEval ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Score & Feedback Box */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: `1px solid ${scoreColor}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                      AI Assessment
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 800,
                        color: scoreColor,
                        background: 'var(--bg-elevated)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Score: {scorePct}%
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    <strong>Feedback:</strong> {currentEval.feedback}
                  </div>
                </div>

                {/* Model Answer Box */}
                {currentEval.model_answer && (
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--success)' }}>
                      <Sparkles size={15} color="var(--success)" />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Model Answer / Best Practice
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, whitespace: 'pre-line' }}>
                      {currentEval.model_answer}
                    </div>
                  </div>
                )}

                {/* Next Question CTA */}
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={ArrowRight}
                  onClick={handleNextQuestion}
                  style={{ alignSelf: 'flex-end', marginTop: '4px' }}
                >
                  Next Question →
                </Button>
              </div>
            ) : (
              /* User Answer Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Answer
                  </label>
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response cleanly. Mention key concepts, tradeoffs, complexity, or edge cases..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={!userAnswer.trim()}
                  style={{ alignSelf: 'flex-end' }}
                >
                  Submit Answer for AI Evaluation
                </Button>
              </form>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
