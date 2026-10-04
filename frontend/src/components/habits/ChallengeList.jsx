import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, CheckCircle2, Zap, Flame, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Skeleton } from '../ui/Spinner';
import { getChallenges } from '../../api/habits';

export const ChallengeList = ({ compact = false }) => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly'

  const { data: challenges = [], isLoading, isError } = useQuery({
    queryKey: ['habits', 'challenges'],
    queryFn: getChallenges,
  });

  const dailyChallenges = challenges.filter((c) => c.period === 'daily');
  const weeklyChallenges = challenges.filter((c) => c.period === 'weekly');

  const displayedList = compact
    ? challenges.slice(0, 3)
    : activeTab === 'daily'
    ? dailyChallenges
    : weeklyChallenges;

  return (
    <Card padding={compact ? '18px' : '24px'} accent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={18} color="var(--accent)" />
          <h3 style={{ fontSize: compact ? 'var(--text-sm)' : 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {compact ? 'Active Campaign Challenges' : 'Campaign Challenges'}
          </h3>
        </div>

        {!compact && (
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveTab('daily')}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                background: activeTab === 'daily' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'daily' ? '#0C0E11' : 'var(--text-tertiary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
              }}
            >
              Today ({dailyChallenges.length})
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                background: activeTab === 'weekly' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'weekly' ? '#0C0E11' : 'var(--text-tertiary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
              }}
            >
              This Week ({weeklyChallenges.length})
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height="60px" borderRadius="12px" />
          <Skeleton height="60px" borderRadius="12px" />
        </div>
      ) : isError || challenges.length === 0 ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
          Challenges load after your first task of the day.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayedList.map((ch) => {
            const isDone = ch.status === 'completed';
            const pct = ch.target > 0 ? Math.min(100, Math.round((ch.progress / ch.target) * 100)) : 0;

            return (
              <div
                key={ch.id}
                style={{
                  background: isDone ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-elevated)',
                  border: `1px solid ${isDone ? 'var(--success-border)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: compact ? '10px 12px' : '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: isDone ? 0.85 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isDone ? (
                        <CheckCircle2 size={16} color="var(--success)" flexShrink={0} />
                      ) : (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {ch.title}
                      </span>
                    </div>
                    {!compact && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '4px 0 0 14px' }}>
                        {ch.description}
                      </p>
                    )}
                  </div>

                  <Badge variant={isDone ? 'success' : 'xp'} icon={Zap}>
                    +{ch.xp_reward} XP
                  </Badge>
                </div>

                {/* Progress bar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar progress={pct} variant={isDone ? 'success' : 'cyan'} height="4px" />
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isDone ? 'var(--success)' : 'var(--text-tertiary)' }}>
                    {ch.progress} / {ch.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
