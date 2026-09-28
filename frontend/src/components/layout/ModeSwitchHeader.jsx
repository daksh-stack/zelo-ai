import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Flame } from 'lucide-react';

export const ModeSwitchHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isRescue = location.pathname.startsWith('/exam-rescue');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-elevated)',
        border: `1px solid ${isRescue ? 'rgba(239, 68, 68, 0.35)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-full)',
        padding: '3px',
        gap: '2px',
        transition: 'all var(--t-base)',
      }}
    >
      {/* Skill Path Segment */}
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all var(--t-base)',
          color: !isRescue ? 'var(--accent)' : 'var(--text-tertiary)',
          background: !isRescue ? 'var(--accent-dim)' : 'transparent',
          boxShadow: !isRescue ? '0 0 0 1px var(--accent-border)' : 'none',
        }}
      >
        <Target size={13} color={!isRescue ? 'var(--accent)' : 'currentColor'} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 700 }}>Skill Path</span>
          <span style={{ fontSize: '0.58rem', opacity: 0.85, fontWeight: 500 }}>Build skills</span>
        </div>
      </button>

      {/* Exam Rescue Segment */}
      <button
        type="button"
        onClick={() => navigate('/exam-rescue')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all var(--t-base)',
          color: isRescue ? '#EF4444' : 'var(--text-tertiary)',
          background: isRescue ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
          boxShadow: isRescue ? '0 0 0 1px rgba(239, 68, 68, 0.4)' : 'none',
        }}
      >
        <Flame size={13} color={isRescue ? '#EF4444' : 'currentColor'} fill={isRescue ? '#EF4444' : 'none'} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 700 }}>Exam Rescue</span>
          <span style={{ fontSize: '0.58rem', opacity: 0.85, fontWeight: 500 }}>Exam tonight</span>
        </div>
      </button>
    </div>
  );
};
