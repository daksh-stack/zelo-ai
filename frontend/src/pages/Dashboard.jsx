import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  Target,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Spinner, Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { getProgressSummaryApi } from '../api/progress';
import { getTodayTasksApi, completeTaskApi } from '../api/tasks';
import { getCurrentRoadmapApi } from '../api/roadmaps';
import { listExamSessions } from '../api/examRescue';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/dashboard/TaskCard';
import { StreakWidget } from '../components/dashboard/StreakWidget';
import { XpWidget } from '../components/dashboard/XpWidget';
import { RoadmapPhaseWidget } from '../components/dashboard/RoadmapPhaseWidget';
import { CelebrationModal } from '../components/dashboard/CelebrationModal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSummary = useAppStore((s) => s.setSummary);

  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Today's formatted date string
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Parallel Data Queries using TanStack Query
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['progressSummary'],
    queryFn: getProgressSummaryApi,
    onSuccess: (data) => setSummary(data),
  });

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['todayTasks'],
    queryFn: getTodayTasksApi,
  });

  const {
    data: roadmapData,
    isLoading: isRoadmapLoading,
  } = useQuery({
    queryKey: ['currentRoadmap'],
    queryFn: getCurrentRoadmapApi,
    retry: false,
  });

  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData);
    }
  }, [summaryData, setSummary]);

  // 2. Complete Task Mutation with Optimistic Updates
  const completeMutation = useMutation({
    mutationFn: ({ taskId, status }) => completeTaskApi(taskId, status),
    onMutate: async ({ taskId, status }) => {
      setPendingTaskId(taskId);
      await queryClient.cancelQueries({ queryKey: ['todayTasks'] });
      const previousTasks = queryClient.getQueryData(['todayTasks']);

      if (previousTasks?.tasks) {
        const updatedTasks = previousTasks.tasks.map((t) =>
          t.id === taskId ? { ...t, status } : t
        );
        queryClient.setQueryData(['todayTasks'], { ...previousTasks, tasks: updatedTasks });
      }

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['todayTasks'], context.previousTasks);
      }
      showToast(err?.response?.data?.detail || 'Failed to update task status.', 'error');
    },
    onSuccess: async (data, variables) => {
      const [newSummary, newTasksData] = await Promise.all([
        refetchSummary(),
        refetchTasks(),
      ]);

      const tasksList = newTasksData?.data?.tasks || [];
      const allCompleted =
        tasksList.length > 0 && tasksList.every((t) => t.status === 'done');

      if (variables.status === 'done') {
        showToast(`+${data.xp_value} XP Earned!`, 'success');
      }

      if (allCompleted) {
        setShowCelebration(true);
      }
    },
    onSettled: () => {
      setPendingTaskId(null);
    },
  });

  const handleTaskComplete = (taskId, status) => {
    completeMutation.mutate({ taskId, status });
  };

  const tasksList = tasksData?.tasks || [];
  const sortedTasks = [...tasksList].sort((a, b) => (a.order || 0) - (b.order || 0));

  const completedCount = sortedTasks.filter((t) => t.status === 'done').length;
  const totalCount = sortedTasks.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const firstPendingTask = sortedTasks.find((t) => t.status === 'pending');

  const scrollToFirstPending = () => {
    if (firstPendingTask) {
      const elem = document.getElementById(`task-card-${firstPendingTask.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      showToast('All missions for today are already complete!', 'success');
    }
  };

  const isInitialLoading = isSummaryLoading || isTasksLoading;

  return (
    <AppShell title="Missions Command">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Header Card */}
        <Card padding="24px" glow glowColor="accent" accent>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Calendar size={15} color="var(--accent)" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {todayFormatted}
                </span>
              </div>
              <h1
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Execute today’s missions.
              </h1>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Relentless execution builds true engineering mastery.
              </p>
            </div>

            {/* Quick Completion Gauge Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 16px',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--success)' }}>
                  {completedCount} / {totalCount} Cleared
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Daily Missions</div>
              </div>
              <div style={{ width: '80px' }}>
                <ProgressBar progress={completionPercentage} variant="success" height="6px" />
              </div>
            </div>
          </div>
        </Card>

        {/* Exam Rescue Teaser Card */}
        <ExamRescueTeaserCard navigate={navigate} />

        {/* Main Grid Layout (70% Left / 30% Right) */}
        <div className="dashboard-grid">
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Task Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Missions Queue
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  Prioritized execution queue based on target tech role
                </p>
              </div>

              {firstPendingTask && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={Play}
                  onClick={scrollToFirstPending}
                >
                  Focus Active Mission
                </Button>
              )}
            </div>

            {/* Loading Skeleton State */}
            {isInitialLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Skeleton height="100px" borderRadius="16px" />
                <Skeleton height="100px" borderRadius="16px" />
                <Skeleton height="100px" borderRadius="16px" />
              </div>
            ) : isTasksError ? (
              <Card padding="28px" accent>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-danger)', marginBottom: '14px', fontSize: 'var(--text-sm)' }}>
                    {tasksError?.response?.data?.detail || 'Failed to load today’s missions.'}
                  </p>
                  <Button variant="secondary" leftIcon={RotateCcw} onClick={() => refetchTasks()}>
                    Retry Connection
                  </Button>
                </div>
              </Card>
            ) : sortedTasks.length === 0 ? (
              <Card padding="32px" accent>
                <div style={{ textAlign: 'center' }}>
                  <Clock size={36} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Generating today’s campaign plan...
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '18px' }}>
                    Your custom daily missions are being constructed from your active campaign.
                  </p>
                  <Button variant="primary" leftIcon={RotateCcw} onClick={() => refetchTasks()}>
                    Sync Today's Plan
                  </Button>
                </div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <AnimatePresence>
                  {sortedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                      isPendingAction={pendingTaskId === task.id}
                      isFirstPending={firstPendingTask?.id === task.id}
                    />
                  ))}
                </AnimatePresence>

                {/* Day Completed Banner */}
                {completedCount === totalCount && totalCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: 'var(--success-dim)',
                      border: '1px solid var(--success-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '20px',
                      textAlign: 'center',
                    }}
                  >
                    <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                    <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)' }}>
                      All Daily Missions Cleared! 🔥
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Outstanding work warrior. Return tomorrow to keep your flame streak burning strong.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StreakWidget streak={summaryData?.streak} />
            <XpWidget xpData={summaryData?.xp} />
            <RoadmapPhaseWidget roadmap={roadmapData} />
          </div>
        </div>
      </div>

      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        streakCount={summaryData?.streak?.current_streak || 1}
        xpEarned={sortedTasks.reduce((acc, t) => acc + (t.status === 'done' ? t.xp_value : 0), 0)}
      />

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }
        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AppShell>
  );
};

const ExamRescueTeaserCard = ({ navigate }) => {
  const { data: sessionsData } = useQuery({
    queryKey: ['examSessionsListTeaser'],
    queryFn: listExamSessions,
    retry: false,
    staleTime: 30000,
  });

  const sessionsList = Array.isArray(sessionsData)
    ? sessionsData
    : sessionsData?.sessions || sessionsData?.data || [];

  const activeSession = sessionsList.find(
    (s) => s.status !== 'completed' && s.status !== 'finished'
  );

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(249, 115, 22, 0.06) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Flame size={20} color="#EF4444" fill="#EF4444" />
        </div>
        <div>
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {activeSession ? `Exam Tonight? Active Session: ${activeSession.subject}` : 'Exam Tonight?'}
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {activeSession
              ? `You have an active timed crash plan for ${activeSession.subject}. Continue revision now.`
              : 'Don’t panic. Generate a high-yield timed crash plan for the hours you have left.'}
          </p>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        rightIcon={ArrowRight}
        onClick={() => {
          if (activeSession) {
            navigate(`/exam-rescue/session/${activeSession.id}`);
          } else {
            navigate('/exam-rescue');
          }
        }}
        style={{
          background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
          borderColor: '#EF4444',
          flexShrink: 0,
        }}
      >
        {activeSession ? `Continue ${activeSession.subject} Rescue` : 'Open Exam Rescue'}
      </Button>
    </div>
  );
};
