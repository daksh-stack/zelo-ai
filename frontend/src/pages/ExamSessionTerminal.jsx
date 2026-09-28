import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, CheckCircle2, FileText, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Spinner, Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { getExamSession, updateTopicStatus, completeExamSession } from '../api/examRescue';
import { ExamCountdown } from '../components/exam/ExamCountdown';
import { TopicAgenda } from '../components/exam/TopicAgenda';
import { TopicCoachCard } from '../components/exam/TopicCoachCard';
import { useAppStore } from '../store/appStore';

export const ExamSessionTerminal = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSummary = useAppStore((s) => s.fetchSummary);

  const [selectedTopicId, setSelectedTopicId] = useState(null);

  // Fetch session details + topics
  const {
    data: sessionData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['examSession', sessionId],
    queryFn: () => getExamSession(sessionId),
    enabled: !!sessionId,
    retry: 1,
  });

  // Automatically select first topic or first pending topic on load
  useEffect(() => {
    if (sessionData && sessionData.topics && sessionData.topics.length > 0) {
      if (!selectedTopicId) {
        const firstPending = sessionData.topics.find((t) => t.status === 'pending' || t.status === 'in_progress');
        setSelectedTopicId(firstPending ? firstPending.id : sessionData.topics[0].id);
      }
    }
  }, [sessionData, selectedTopicId]);

  // Topic Status Mutation with Optimistic Updates
  const statusMutation = useMutation({
    mutationFn: ({ topicId, status }) => updateTopicStatus(topicId, status),
    onMutate: async ({ topicId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['examSession', sessionId] });
      const previousSession = queryClient.getQueryData(['examSession', sessionId]);

      if (previousSession && previousSession.topics) {
        const updatedTopics = previousSession.topics.map((t) =>
          t.id === topicId ? { ...t, status, covered_at: status === 'covered' ? new Date().toISOString() : t.covered_at } : t
        );
        queryClient.setQueryData(['examSession', sessionId], {
          ...previousSession,
          topics: updatedTopics,
        });
      }

      return { previousSession };
    },
    onError: (err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(['examSession', sessionId], context.previousSession);
      }
      const detail = err?.response?.data?.detail || 'Failed to update topic status.';
      showToast(detail, 'error');
    },
    onSuccess: (data, variables) => {
      if (variables.status === 'covered') {
        showToast('+15 XP Earned!', 'success');
        // Refresh global progress summary for XP
        fetchSummary();
        queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
      }
      refetch();
    },
  });

  // Complete session mutation
  const completeMutation = useMutation({
    mutationFn: () => completeExamSession(sessionId),
    onSuccess: () => {
      showToast('Exam rescue session completed! Good luck on your exam!', 'success');
      refetch();
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to complete session.';
      showToast(detail, 'error');
    },
  });

  const handleUpdateStatus = (topicId, status) => {
    statusMutation.mutate({ topicId, status });
  };

  if (isLoading) {
    return (
      <AppShell title="Exam Rescue Terminal">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Skeleton height="120px" borderRadius="16px" />
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
            <Skeleton height="400px" borderRadius="16px" />
            <Skeleton height="400px" borderRadius="16px" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError || !sessionData) {
    return (
      <AppShell title="Exam Rescue Terminal">
        <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <Card padding="32px" accent>
            <AlertCircle size={40} color="var(--text-danger)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Session Not Found
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '20px' }}>
              {error?.response?.data?.detail || 'The requested exam rescue session could not be retrieved.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/exam-rescue')}>
              Return to Rescue Setup
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  const topics = sessionData.topics || [];
  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  const coveredCount = topics.filter((t) => t.status === 'covered').length;
  const skippedCount = topics.filter((t) => t.status === 'skipped').length;
  const totalCount = topics.length;
  const coveredMinutes = topics.reduce((sum, t) => sum + (t.status === 'covered' ? (t.allocated_minutes || 30) : 0), 0);
  const totalMinutes = topics.reduce((sum, t) => sum + (t.allocated_minutes || 30), 0);

  const progressPct = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && coveredCount + skippedCount === totalCount;

  return (
    <AppShell title={`${sessionData.subject || 'OS'} Exam Rescue`}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Sticky/Header Bar */}
        <Card padding="20px" accent glow glowColor="danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Flame size={16} color="#EF4444" fill="#EF4444" />
                <span style={{ fontSize: 'var(--text-xs)', color: '#EF4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Subject: {sessionData.subject}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Strategy: {sessionData.strategy === 'high_yield' ? 'High-Yield Only' : 'Full Syllabus Pass'}
                </span>
              </div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Crash Revision Terminal
              </h1>
            </div>

            {/* Overall Progress Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {coveredCount} / {totalCount} Topics Covered
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  {coveredMinutes} / {totalMinutes} mins cleared
                </div>
              </div>
              <div style={{ width: '100px' }}>
                <ProgressBar progress={progressPct} variant="danger" height="8px" />
              </div>
              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                onClick={() => navigate(`/exam-rescue/session/${sessionId}/revision`)}
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)', borderColor: '#EF4444' }}
              >
                Revision Sheet
              </Button>
            </div>
          </div>
        </Card>

        {/* Plan Complete Banner */}
        {isAllDone && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={28} color="var(--success)" />
              <div>
                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Tonight’s Rescue Plan Complete! 🎉
                </h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  All topics processed. Open your 30-min final revision sheet now.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/exam-rescue/session/${sessionId}/revision`)}
                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
              >
                Open Revision Sheet
              </Button>
              {sessionData.status !== 'completed' && (
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={completeMutation.isPending}
                  onClick={() => completeMutation.mutate()}
                >
                  Mark Session Finished
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Grid: Left Sidebar (Countdown & Agenda) / Right Content (Coach Card) */}
        <div className="terminal-grid">
          {/* LEFT COLUMN (~32%) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ExamCountdown examTime={sessionData.exam_time} hoursAvailable={sessionData.hours_available} />
            <TopicAgenda
              topics={topics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={(t) => setSelectedTopicId(t.id)}
            />
          </div>

          {/* MAIN CONTENT (~68%) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TopicCoachCard
              topic={selectedTopic}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={statusMutation.isPending}
            />
          </div>
        </div>
      </div>

      <style>{`
        .terminal-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
        }
        @media (max-width: 992px) {
          .terminal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
};
