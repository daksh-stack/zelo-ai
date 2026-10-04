import React from 'react';
import { Flame, Award, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { FreezeButton } from '../habits/FreezeButton';

export const StreakWidget = ({ streak }) => {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const freezes = streak?.freezes_remaining ?? 1;
  const lastActiveDate = streak?.last_active_date;
  const isOnFire = current >= 3;

  return (
    <Card padding="18px" glow={isOnFire} glowColor="streak" accent>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
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
            flexShrink: 0,
          }}
        >
          <Flame
            size={22}
            color="var(--streak)"
            fill={isOnFire ? 'var(--streak)' : 'none'}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: current > 0 ? 'var(--streak)' : 'var(--text-secondary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            {current} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-tertiary)' }}>day</span>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {current > 0 ? 'Flame of Discipline' : 'Complete a mission to ignite'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Award size={13} color="#FBBF24" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Best</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {longest}d
          </div>
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <ShieldCheck size={13} color="var(--accent)" />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Freezes</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {freezes}
          </div>
        </div>
      </div>

      {/* Freeze Action Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <FreezeButton freezesRemaining={freezes} currentStreak={current} size="sm" />
      </div>
    </Card>
  );
};
