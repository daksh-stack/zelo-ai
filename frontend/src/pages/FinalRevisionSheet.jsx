import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  FileText,
  Copy,
  Printer,
  ArrowLeft,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
  Zap,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { getRevisionSheet, completeExamSession } from '../api/examRescue';

export const FinalRevisionSheet = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const {
    data: sheet,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['revisionSheet', sessionId],
    queryFn: () => getRevisionSheet(sessionId),
    enabled: !!sessionId,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeExamSession(sessionId),
    onSuccess: () => {
      showToast('Exam rescue session marked complete! Best of luck!', 'success');
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to complete session.', 'error');
    },
  });

  const handleCopySummary = () => {
    if (!sheet) return;

    let text = `=== ZELO-AI EXAM REVISION SHEET: ${sheet.subject} ===\n`;
    text += `Generated: ${new Date(sheet.generated_at || Date.now()).toLocaleString()}\n`;
    text += `Strategy: ${sheet.strategy === 'high_yield' ? 'High-Yield' : 'Full Pass'}\n`;
    text += `Covered Topics: ${sheet.covered_count} | Skipped: ${sheet.skipped_count} | Pending: ${sheet.pending_count}\n\n`;

    if (sheet.covered_titles && sheet.covered_titles.length > 0) {
      text += `--- COVERED TOPICS ---\n`;
      sheet.covered_titles.forEach((t, i) => {
        text += `${i + 1}. ${typeof t === 'string' ? t : t.title}\n`;
      });
      text += `\n`;
    }

    if (sheet.formulas && sheet.formulas.length > 0) {
      text += `--- KEY FORMULAS & FACTS ---\n`;
      sheet.formulas.forEach((f, i) => {
        const itemText = typeof f === 'string' ? f : f.item || f.formula || JSON.stringify(f);
        const topicText = typeof f === 'object' && f.topic ? ` (${f.topic})` : '';
        text += `• ${itemText}${topicText}\n`;
      });
      text += `\n`;
    }

    if (sheet.top_questions && sheet.top_questions.length > 0) {
      text += `--- TOP LIKELY EXAM QUESTIONS ---\n`;
      sheet.top_questions.forEach((q, i) => {
        const questionText = typeof q === 'string' ? q : q.q || q.question;
        const answerText = typeof q === 'object' ? q.a || q.answer : '';
        text += `Q${i + 1}: ${questionText}\n`;
        if (answerText) text += `A: ${answerText}\n`;
        text += `\n`;
      });
    }

    navigator.clipboard.writeText(text);
    showToast('Revision summary copied to clipboard!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppShell title="Final 30-Min Revision Sheet">
        <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Skeleton height="140px" borderRadius="16px" />
          <Skeleton height="200px" borderRadius="16px" />
          <Skeleton height="300px" borderRadius="16px" />
        </div>
      </AppShell>
    );
  }

  if (isError || !sheet) {
    return (
      <AppShell title="Final 30-Min Revision Sheet">
        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <Card padding="32px">
            <AlertTriangle size={36} color="var(--text-danger)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Revision Sheet Unavailable
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '20px' }}>
              {error?.response?.data?.detail || 'Could not load revision sheet for this session.'}
            </p>
            <Button variant="primary" onClick={() => navigate(`/exam-rescue/session/${sessionId}`)}>
              Back to Session Terminal
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  const coveredTitles = Array.isArray(sheet.covered_titles) ? sheet.covered_titles : [];
  const skippedTitles = Array.isArray(sheet.skipped_titles) ? sheet.skipped_titles : [];
  const formulas = Array.isArray(sheet.formulas) ? sheet.formulas : [];
  const topQuestions = Array.isArray(sheet.top_questions) ? sheet.top_questions : [];

  const formattedExamTime = sheet.exam_time
    ? new Date(sheet.exam_time).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <AppShell title={`${sheet.subject || 'OS'} 30-Min Revision Sheet`}>
      <div className="printable-sheet" style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate(`/exam-rescue/session/${sessionId}`)}
          >
            Back to Session Terminal
          </Button>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Copy}
              onClick={handleCopySummary}
            >
              Copy Summary
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Printer}
              onClick={handlePrint}
            >
              Print Revision Sheet
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={ShieldCheck}
              isLoading={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
              style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)', borderColor: '#EF4444' }}
            >
              Finish Exam Rescue
            </Button>
          </div>
        </div>

        {/* Warning if no topics covered */}
        {sheet.covered_count === 0 && (
          <div
            className="no-print"
            style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#F97316',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={18} flexShrink={0} />
            <span>
              Cover at least one topic in the session terminal so the revision sheet has full content.
            </span>
          </div>
        )}

        {/* Sheet Content Card / Container */}
        <Card padding="32px" accent glow glowColor="danger">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 1. Header */}
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    30-Minute Final Revision Sheet
                  </div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                    {sheet.subject} Crash Summary
                  </h1>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {formattedExamTime && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Exam Time: {formattedExamTime}
                    </div>
                  )}
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Strategy: {sheet.strategy === 'high_yield' ? 'High-Yield Only' : 'Full Syllabus Pass'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 'var(--radius-lg)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                  {sheet.covered_count || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>Covered Topics</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {sheet.skipped_count || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Skipped Topics</div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-lg)', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>
                  {sheet.pending_count || 0}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Topics</div>
              </div>
            </div>

            {/* 3. Formulas Grouped */}
            {formulas.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <Zap size={16} color="var(--accent)" />
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
                    Core Formulas & Key Rules ({formulas.length})
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                  {formulas.map((item, idx) => {
                    const text = typeof item === 'string' ? item : item.item || item.formula || JSON.stringify(item);
                    const topicLabel = typeof item === 'object' && item.topic ? item.topic : null;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                        }}
                      >
                        {topicLabel && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                            {topicLabel}
                          </div>
                        )}
                        <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Top Likely Questions */}
            {topQuestions.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <HelpCircle size={16} color="#A78BFA" />
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#A78BFA', margin: 0 }}>
                    Top Likely Exam Questions ({topQuestions.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topQuestions.map((qObj, idx) => {
                    const questionText = typeof qObj === 'string' ? qObj : qObj.q || qObj.question;
                    const answerText = typeof qObj === 'object' ? qObj.a || qObj.answer : null;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '14px',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Q{idx + 1}: {questionText}
                        </div>
                        {answerText && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(167, 139, 250, 0.05)', padding: '8px 10px', borderRadius: 'var(--radius-md)' }}>
                            <strong>Key Answer Points:</strong> {answerText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Lists of Covered & Skipped Titles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Covered Titles */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                    Covered Topics ({coveredTitles.length})
                  </h4>
                </div>

                {coveredTitles.length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    No topics marked covered yet.
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {coveredTitles.map((t, idx) => (
                      <li key={idx}>{typeof t === 'string' ? t : t.title}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Skipped Titles */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <MinusCircle size={16} color="var(--text-tertiary)" />
                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                    Skipped / Low Priority ({skippedTitles.length})
                  </h4>
                </div>

                {skippedTitles.length === 0 ? (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    No topics skipped.
                  </div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    {skippedTitles.map((t, idx) => (
                      <li key={idx}>{typeof t === 'string' ? t : t.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @media print {
          .no-print, header, aside, .mobile-bottom-nav {
            display: none !important;
          }
          body {
            background: #FFF !important;
            color: #000 !important;
          }
          .printable-sheet {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
