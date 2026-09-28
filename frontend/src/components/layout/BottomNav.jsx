import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Flame, Map, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Rescue',    path: '/exam-rescue',icon: Flame, isRescue: true },
  { label: 'Roadmap',   path: '/roadmap',   icon: Map },
  { label: 'Profile',   path: '/profile',   icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  const isRescueRoute = location.pathname.startsWith('/exam-rescue');

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(12, 14, 17, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${isRescueRoute ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }}
    >
      {/* Warrior edge top line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: isRescueRoute
            ? 'linear-gradient(90deg, transparent 0%, #EF4444 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%)',
        }}
      />

      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => {
              const activeColor = item.isRescue ? '#EF4444' : 'var(--accent)';
              return {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                color: isActive ? activeColor : 'var(--text-tertiary)',
                fontSize: '0.6rem',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--t-fast)',
                position: 'relative',
              };
            }}
          >
            {({ isActive }) => {
              const activeColor = item.isRescue ? '#EF4444' : 'var(--accent)';
              return (
                <>
                  <Icon size={17} color={isActive ? activeColor : undefined} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        width: '20px',
                        height: '2px',
                        background: activeColor,
                        borderRadius: '0 0 2px 2px',
                      }}
                    />
                  )}
                </>
              );
            }}
          </NavLink>
        );
      })}
    </nav>
  );
};
