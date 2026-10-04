import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck,
  Shield,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Users,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { getProgressSummaryApi } from '../api/progress';
import { getProfileApi } from '../api/profile';
import { getWeeklyReport, advanceRoadmapPhase } from '../api/insights';
import { FreezeButton } from '../components/habits/FreezeButton';
import { ChallengeList } from '../components/habits/ChallengeList';
import { BadgeShelf } from '../components/habits/BadgeShelf';

export const ProgressPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdvancing, setIsAdvancing] = useState(false);

  // 1. Weekly Report Query
  const {
    data: weeklyReport,
    isLoading: isWeeklyLoading,
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: ['insights', 'weekly'],
    queryFn: getWeeklyReport,
    retry: false,
  });

  // 2. Summary and Profile Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['progressSummary'],
    queryFn: getProgressSummaryApi,
  });

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfileApi,
  });

  // Advance Phase Mutation
  const advanceMutation = useMutation({
    mutationFn: advanceRoadmapPhase,
    onMutate: () => setIsAdvancing(true),
    onSuccess: (data) => {
      const title = data?.phase_title || `Phase ${data?.current_phase + 1}`;
      showToast(`Phase advanced successfully! Now on ${title}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['insights', 'weekly'] });
      queryClient.invalidateQueries({ queryKey: ['currentRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.message || 'Unable to advance phase at this time.';
      showToast(detail, 'error');
    },
    onSettled: () => setIsAdvancing(false),
  });

  const streak = summary?.streak || {};
  const xp = summary?.xp || {};
  const today = summary?.today || {};

  const currentStreak = streak.current_streak || 0;
  const longestStreak = streak.longest_streak || 0;
  const totalXp = xp.total_xp || 0;
  const level = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;
  const freezes = streak.freezes_remaining ?? 1;

  // 7-day consistency strip
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 0-indexed Mon-Sun

  const consistencyDays = daysOfWeek.map((day, idx) => {
    let active = false;
    if (idx === todayIdx) {
      active = today.completed_tasks > 0;
    } else if (idx < todayIdx && currentStreak > (todayIdx - idx)) {
      active = true;
    }
    return { day, active, isToday: idx === todayIdx };
  });

  const isLoading = isSummaryLoading || isProfileLoading || isWeeklyLoading;

  // Weekly stats values formatting
  const daysPlanned = weeklyReport?.days_planned ?? 0;
  const completionRatePct = Math.round((weeklyReport?.completion_rate || 0) * 100);
  const skipRatePct = Math.round((weeklyReport?.skip_rate || 0) * 100);
  const quizAccuracyStr =
    weeklyReport?.quiz_accuracy !== null && weeklyReport?.quiz_accuracy !== undefined
      ? `${Math.round(weeklyReport.quiz_accuracy * 100)}%`
      : '—';
  const currentPhaseNum = (weeklyReport?.current_phase ?? 0) + 1;
  const recommendations = weeklyReport?.recommendations || [];

  return (
    <AppShell title="Progress & Adaptive Insights">
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Weekly Report Card */}
        <Card padding="24px" glow glowColor="accent" accent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Calendar size={16} color="var(--accent)" />
                  <Badge variant="cyan">LAST 7 DAYS</Badge>
                  <Badge variant="muted">Phase {currentPhaseNum}</Badge>
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {weeklyReport?.roadmap_title || 'Skill Path Performance Report'}
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Adaptive workload analysis & skill retention metrics
                </p>
              </div>

              {/* Advance Phase CTA */}
              <div>
                {weeklyReport?.can_advance_phase ? (
                  <Button
                    variant="primary"
                    size="md"
                    rightIcon={ArrowRight}
                    isLoading={isAdvancing}
                    onClick={() => advanceMutation.mutate()}
                  >
                    Advance to Next Phase
                  </Button>
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', maxWidth: '280px' }}>
                    Keep a 5-day streak of finishing most tasks to unlock the next phase.
                  </div>
                )}
              </div>
            </div>

            {/* 4 Stat Metrics Grid */}
            {isWeeklyLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <Skeleton height="70px" borderRadius="12px" />
                <Skeleton height="70px" borderRadius="12px" />
                <Skeleton height="70px" borderRadius="12px" />
                <Skeleton height="70px" borderRadius="12px" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {/* Metric 1 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Planned Days</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {daysPlanned} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>/ 7 days</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Completion</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
                    {completionRatePct}%
                  </div>
                </div>

                {/* Metric 3 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Skip Rate</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: skipRatePct > 20 ? 'var(--text-danger)' : 'var(--text-secondary)', marginTop: '2px' }}>
                    {skipRatePct}%
                  </div>
                </div>

                {/* Metric 4 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Quiz Accuracy</div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--xp)', marginTop: '2px' }}>
                    {quizAccuracyStr}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Bullets */}
            {recommendations.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  <Lightbulb size={14} />
                  Adaptive Recommendations
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {recommendations.map((rec, i) => (
                    <li key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Phase 5: Squad Board Teaser Card */}
        <div
          onClick={() => navigate('/squad')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px 20px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="var(--accent)" />
            </div>
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Squad & Leaderboards
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Compare ranks across your friends, study circles, and campus college board.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)' }}>
            <span>Open Squad</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
          </div>
        ) : (
          <>
            {/* Top 3 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              {/* Streak Card with Freeze Button */}
              <Card padding="20px" glow glowColor="streak" accent style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--streak-dim)',
                        border: '1px solid var(--streak-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Flame size={22} color="var(--streak)" fill="var(--streak)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--streak)' }}>
                        {currentStreak} Days
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Current Active Streak</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px', marginBottom: '12px' }}>
                    <span>Longest Streak:</span>
                    <span style={{ color: 'var(--streak)', fontWeight: 700 }}>{longestStreak} Days</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <FreezeButton freezesRemaining={freezes} currentStreak={currentStreak} size="sm" />
                </div>
              </Card>

              {/* XP Level Card */}
              <Card padding="20px" accent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--xp-dim)',
                      border: '1px solid rgba(167,139,250,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap size={22} color="var(--xp)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--xp)' }}>
                      Rank {level}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{totalXp} Total XP Earned</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                    <span>Rank {level} progress</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{xpInCurrentLevel} / 100 XP</span>
                  </div>
                  <ProgressBar progress={xpInCurrentLevel} variant="xp" height="5px" />
                </div>
              </Card>

              {/* Freezes & Protection Card */}
              <Card padding="20px" accent>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={22} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--accent)' }}>
                      {freezes} Freezes
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Streak Protection Shields</div>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  Prevents streak loss on emergency break days
                </div>
              </Card>
            </div>

            {/* 7-Day Consistency Strip */}
            <Card padding="24px" accent>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                7-Day Discipline Strip
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                {consistencyDays.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      background: d.active
                        ? 'var(--accent-dim)'
                        : d.isToday
                          ? 'var(--bg-elevated)'
                          : 'var(--bg-base)',
                      border: `1px solid ${d.active
                          ? 'var(--accent-border)'
                          : d.isToday
                            ? 'var(--accent)'
                            : 'var(--border)'
                        }`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '12px 6px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>{d.day}</span>
                    {d.active ? (
                      <CheckCircle2 size={18} color="var(--accent)" />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Phase 4: Campaign Challenges Section */}
            <ChallengeList compact={false} />

            {/* Phase 4: Warrior Badge Shelf */}
            <BadgeShelf compact={false} />
          </>
        )}
      </div>
    </AppShell>
  );
};
