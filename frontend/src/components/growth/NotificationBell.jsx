import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { getNotifications } from '../../api/growth';
import { NotificationDrawer } from './NotificationDrawer';

export const NotificationBell = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['growth', 'notifications'],
    queryFn: () => getNotifications({ unreadOnly: false, limit: 30 }),
    refetchInterval: () => (document.visibilityState === 'visible' ? 60000 : false),
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        title="Dispatches & Notifications"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          color: unreadCount > 0 ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all var(--t-fast)',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '9px',
              background: 'var(--accent)',
              color: '#0C0E11',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--accent-glow)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
      />
    </>
  );
};
