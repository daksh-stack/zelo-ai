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
  Layers,
  MessageSquare,
  TrendingUp,
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
import { getWeeklyReport } from '../api/insights';
import { useAppStore } from '../store/appStore';
import { TaskCard } from '../components/dashboard/TaskCard';
import { StreakWidget } from '../components/dashboard/StreakWidget';
import { XpWidget } from '../components/dashboard/XpWidget';
import { RoadmapPhaseWidget } from '../components/dashboard/RoadmapPhaseWidget';
import { CelebrationModal } from '../components/dashboard/CelebrationModal';
import { SocraticProbeModal } from '../components/skill/SocraticProbeModal';
import { MicroQuizModal } from '../components/tasks/MicroQuizModal';
import { FocusTimer } from '../components/habits/FocusTimer';
import { ChallengeList } from '../components/habits/ChallengeList';
import { trackEvent } from '../lib/trackEvent';

export const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSummary = useAppStore((s) => s.setSummary);

  useEffect(() => {
    trackEvent('dashboard_open', { mode: 'skill' });
  }, []);

  const [pendingTaskId, setPendingTaskId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [probeTask, setProbeTask] = useState(null);
  const [quizTask, setQuizTask] = useState(null);
  const [quizzedTaskIds, setQuizzedTaskIds] = useState(() => new Set());

  // Today's formatted date string
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Data Queries
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

  const { data: weeklyReport } = useQuery({
    queryKey: ['insights', 'weekly'],
    queryFn: getWeeklyReport,
    retry: false,
  });

  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData);
    }
  }, [summaryData, setSummary]);

  // 2. Complete Task Mutation
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
      trackEvent('task_complete', { status: variables.status });

      const [newSummary, newTasksData] = await Promise.all([
        refetchSummary(),
        refetchTasks(),
      ]);

      queryClient.invalidateQueries({ queryKey: ['habits', 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'badges'] });

      const tasksList = newTasksData?.data?.tasks || tasksData?.tasks || [];
      const allCompleted =
        tasksList.length > 0 && tasksList.every((t) => t.status === 'done');

      if (variables.status === 'done') {
        showToast(`+${data.xp_value} XP Earned!`, 'success');

        // Post-task micro-quiz trigger (if not quizzed yet in this session)
        if (!quizzedTaskIds.has(variables.taskId)) {
          const finishedTask = tasksList.find((t) => t.id === variables.taskId) || {
            id: variables.taskId,
            title: 'Completed Task',
          };
          setQuizzedTaskIds((prev) => new Set(prev).add(variables.taskId));
          setQuizTask(finishedTask);
        }
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
  const weeklyCompletionPct = Math.round((weeklyReport?.completion_rate || 0) * 100);

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

        {/* Minimal Dashboard Teaser Card */}
        {weeklyReport && (
          <div
            onClick={() => navigate('/progress')}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '12px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'all var(--t-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-dim)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--accent-border)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={18} color="var(--accent)" />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                This week: <span style={{ color: 'var(--accent)' }}>{weeklyCompletionPct}% completion</span>
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                • {weeklyReport.days_planned ?? 0} planned days
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)' }}>
              <span>View Report</span>
              <ArrowRight size={14} />
            </div>
          </div>
        )}

        {/* Focus Mode Timer Bar / Card */}
        <FocusTimer />

        {/* Exam Rescue Teaser Card */}
        <ExamRescueTeaserCard navigate={navigate} />

        {/* Skill Path Quick Surfaces Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Quick Revision Card */}
          <div
            onClick={() => navigate('/skill-path/quick-revision')}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'all var(--t-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.background = 'var(--accent-dim)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-border)';
              e.currentTarget.style.background = 'var(--bg-surface)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Layers size={20} color="var(--accent)" />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Quick Revision Decks
                </h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Short flashcard recall. Weak areas prioritized.
                </p>
              </div>
            </div>
            <ArrowRight size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          </div>

          {/* Interview Practice Card */}
          <div
            onClick={() => navigate('/skill-path/interview-practice')}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(167, 139, 250, 0.35)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'all var(--t-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#A78BFA';
              e.currentTarget.style.background = 'rgba(167, 139, 250, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.35)';
              e.currentTarget.style.background = 'var(--bg-surface)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(167, 139, 250, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={20} color="#A78BFA" />
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  AI Interview Practice
                </h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Mock interview room with AI feedback & scoring.
                </p>
              </div>
            </div>
            <ArrowRight size={16} color="#A78BFA" style={{ flexShrink: 0 }} />
          </div>
        </div>

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
                      onTestUnderstanding={(t) => setProbeTask(t)}
                      onQuizTask={(t) => setQuizTask(t)}
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
            <ChallengeList compact={true} />
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

      <SocraticProbeModal
        isOpen={!!probeTask}
        onClose={() => setProbeTask(null)}
        taskTitle={probeTask?.title}
        taskDescription={probeTask?.description}
      />

      {/* Post-task micro-quiz modal */}
      <MicroQuizModal
        isOpen={!!quizTask}
        onClose={() => setQuizTask(null)}
        taskId={quizTask?.id}
        taskTitle={quizTask?.title}
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
