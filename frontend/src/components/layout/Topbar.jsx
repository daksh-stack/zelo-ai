import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Flame, Shield, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { ModeSwitchHeader } from './ModeSwitchHeader';
import { NotificationBell } from '../growth/NotificationBell';
import { FeedbackModal } from '../growth/FeedbackModal';

export const Topbar = ({ title }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const summary = useAppStore((s) => s.summary);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const isRescue = location.pathname.startsWith('/exam-rescue');

  const streak = summary?.streak?.current_streak ?? 0;
  const level = summary?.xp?.level ?? 1;
  const totalXp = summary?.xp?.total_xp ?? 0;

  // Abbreviated email for display
  const displayUser = user?.email
    ? user.email.split('@')[0]
    : 'Warrior';

  return (
    <header
      style={{
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(12, 14, 17, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${isRescue ? 'rgba(239, 68, 68, 0.25)' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '16px',
      }}
    >
      {/* Top warrior accent edge line for Exam Rescue vs Skill Path */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isRescue
            ? 'linear-gradient(90deg, #EF4444 0%, #F97316 50%, transparent 100%)'
            : 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)',
          transition: 'background var(--t-base)',
        }}
      />

      {/* Page title + Mode switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
        <h2
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h2>
        <div className="topbar-mode-switcher">
          <ModeSwitchHeader />
        </div>
      </div>

      {/* Right: compact stat pills + growth ops */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Notification Bell */}
        <NotificationBell />

        {/* Feedback Trigger */}
        <button
          onClick={() => setIsFeedbackOpen(true)}
          title="Send feedback or bug report"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
        >
          <MessageSquare size={16} />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />

        {/* Streak */}
        {streak > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'var(--streak-dim)',
              border: '1px solid var(--streak-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--streak)',
            }}
          >
            <Flame size={13} fill="var(--streak)" />
            <span>{streak}d</span>
          </div>
        )}

        {/* Rank */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--xp)',
          }}
        >
          <Shield size={12} />
          <span>Lv.{level}</span>
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>·</span>
          <span style={{ color: 'var(--text-secondary)' }}>{totalXp} XP</span>
        </div>

        {/* User */}
        <div
          style={{
            padding: '4px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayUser}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .topbar-mode-switcher {
            display: none;
          }
        }
      `}</style>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </header>
  );
};

