import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { startInterview, getInterviewSession, submitInterviewAnswer } from '../api/skillPath';
import { InterviewSetup } from '../components/skill/InterviewSetup';
import { InterviewQuestion } from '../components/skill/InterviewQuestion';
import { useAppStore } from '../store/appStore';

export const InterviewPracticePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSummary = useAppStore((s) => s.fetchSummary);

  // Fetch session if sessionId URL param is present
  const {
    data: sessionData,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
  } = useQuery({
    queryKey: ['interviewSession', sessionId],
    queryFn: () => getInterviewSession(sessionId),
    enabled: !!sessionId,
    retry: 1,
  });

  // Mutation to start new interview
  const startMutation = useMutation({
    mutationFn: (payload) => startInterview(payload),
    onSuccess: (data) => {
      showToast('Mock interview session created!', 'success');
      const id = data.id || data.session_id;
      navigate(`/skill-path/interview-practice/${id}`);
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to start interview session.', 'error');
    },
  });

  // Mutation to submit answer
  const answerMutation = useMutation({
    mutationFn: (payload) => submitInterviewAnswer(payload),
    onSuccess: (data) => {
      showToast('XP added! Answer evaluated.', 'success');
      // Invalidate existing progress and XP queries
      fetchSummary();
      queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to submit answer.', 'error');
    },
  });

  const handleStartInterview = (payload) => {
    startMutation.mutate(payload);
  };

  const handleAnswerSubmit = async (answerId, userAnswer) => {
    try {
      const res = await answerMutation.mutateAsync({
        answer_id: answerId,
        user_answer: userAnswer,
      });
      return res;
    } catch (err) {
      return null;
    }
  };

  const handleResetSession = () => {
    navigate('/skill-path/interview-practice');
  };

  // If in active session view
  if (sessionId) {
    if (isSessionLoading) {
      return (
        <AppShell title="Interview Practice Room">
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Skeleton height="100px" borderRadius="16px" />
            <Skeleton height="320px" borderRadius="16px" />
          </div>
        </AppShell>
      );
    }

    if (isSessionError || !sessionData) {
      return (
        <AppShell title="Interview Practice Room">
          <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
            <Card padding="32px">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Session Not Found
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '20px' }}>
                {sessionError?.response?.data?.detail || 'Could not load interview session.'}
              </p>
              <Button variant="primary" onClick={() => navigate('/skill-path/interview-practice')}>
                Start New Mock Interview
              </Button>
            </Card>
          </div>
        </AppShell>
      );
    }

    return (
      <AppShell title={`${(sessionData.domain || 'DSA').toUpperCase()} Mock Interview`}>
        <InterviewQuestion
          session={sessionData}
          onAnswerSubmit={handleAnswerSubmit}
          isSubmitting={answerMutation.isPending}
          onResetSession={handleResetSession}
          navigate={navigate}
        />
      </AppShell>
    );
  }

  // Setup View (No sessionId in URL)
  return (
    <AppShell title="Interview Practice Setup">
      <InterviewSetup
        onStart={handleStartInterview}
        isLoading={startMutation.isPending}
      />
    </AppShell>
  );
};
