import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  User,
  Flame,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

const NAV_ITEMS = [
  { label: 'Missions',    sublabel: 'Today',       path: '/dashboard',   icon: LayoutDashboard },
  { label: 'Exam Rescue', sublabel: 'Crash Coach', path: '/exam-rescue', icon: Flame, isRescue: true },
  { label: 'Campaign',    sublabel: 'Roadmap',     path: '/roadmap',     icon: Map },
  { label: 'Progress',    sublabel: 'Rank',        path: '/progress',    icon: TrendingUp },
  { label: 'Profile',     sublabel: 'Settings',    path: '/profile',     icon: User },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const summary = useAppStore((s) => s.summary);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const streakCount = summary?.streak?.current_streak ?? 0;
  const totalXp = summary?.xp?.total_xp ?? 0;
  const level = summary?.xp?.level ?? Math.floor(totalXp / 100) + 1;

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Subtle top warrior edge */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)',
      }} />

      {/* Brand */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 'var(--radius-md)',
            transition: 'background var(--t-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {/* Crest mark */}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={17} color="#0C0E11" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}>
              Zilo<span style={{ color: 'var(--accent)' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Tech Career
            </div>
          </div>
        </div>
      </div>

      {/* Rank strip */}
      <div
        style={{
          margin: '12px 16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={15} color="var(--streak)" fill="var(--streak)" />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--streak)' }}>
            {streakCount}d
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>streak</span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Rank</span>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>
            Lv.{level}
          </span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{totalXp}</span> XP
        </div>
      </div>

      {/* Nav — section label */}
      <div style={{ padding: '4px 22px 6px', marginTop: '4px' }}>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
        }}>
          Navigate
        </span>
      </div>

      {/* Navigation links */}
      <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => {
                const activeColor = item.isRescue ? '#EF4444' : 'var(--accent)';
                const activeBg = item.isRescue ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-dim)';
                const activeBorder = item.isRescue ? 'rgba(239, 68, 68, 0.35)' : 'var(--accent-border)';
                return {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  color: isActive ? activeColor : 'var(--text-secondary)',
                  background: isActive ? activeBg : 'transparent',
                  border: isActive ? `1px solid ${activeBorder}` : '1px solid transparent',
                  textDecoration: 'none',
                  transition: `all var(--t-base)`,
                };
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.background.includes('accent-dim') && !e.currentTarget.style.background.includes('239')) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.background.includes('accent-dim') && !e.currentTarget.style.background.includes('239')) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {({ isActive }) => {
                const activeColor = item.isRescue ? '#EF4444' : 'var(--accent)';
                return (
                  <>
                    <Icon size={16} color={isActive ? activeColor : undefined} />
                    <div style={{ flex: 1 }}>
                      <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                      <div style={{ fontSize: '0.65rem', color: isActive ? activeColor : 'var(--text-tertiary)', fontWeight: 500, opacity: isActive ? 0.9 : 1, letterSpacing: '0.01em' }}>
                        {item.sublabel}
                      </div>
                    </div>
                    {isActive && (
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: activeColor,
                        flexShrink: 0,
                      }} />
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: `all var(--t-base)`,
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-danger)';
            e.currentTarget.style.background = 'var(--danger-dim)';
            e.currentTarget.style.borderColor = 'var(--danger-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
