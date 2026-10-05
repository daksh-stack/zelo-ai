import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Inbox, ExternalLink } from 'lucide-react';
import { markNotificationsRead } from '../../api/growth';
import { Button } from '../ui/Button';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (isNaN(diffSec)) return '';
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

const KIND_MAP = {
  daily_reminder: { label: 'Mission', color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'var(--accent-border)' },
  streak_risk: { label: 'Streak', color: 'var(--streak)', bg: 'var(--streak-dim)', border: 'var(--streak-border)' },
  challenge: { label: 'Challenge', color: 'var(--xp)', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.3)' },
  system: { label: 'System', color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border)' },
};

export const NotificationDrawer = ({ isOpen, onClose, notifications = [] }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const markMutation = useMutation({
    mutationFn: (id) => markNotificationsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth', 'notifications'] });
    },
  });

  const handleRowClick = (item) => {
    if (!item.is_read) {
      markMutation.mutate(item.id);
    }
    onClose();
    if (item.href) {
      navigate(item.href);
    } else {
      navigate('/dashboard');
    }
  };

  const handleMarkAllRead = () => {
    markMutation.mutate(null);
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
            }}
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '400px',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-base)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={18} color="var(--accent)" />
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Dispatches
                </h3>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                    padding: '32px 16px',
                  }}
                >
                  <Inbox size={36} strokeWidth={1.5} />
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No dispatches
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                      Clear a task today to maintain campaign momentum.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map((item) => {
                    const kindMeta = KIND_MAP[item.kind] || KIND_MAP.system;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: item.is_read ? 'var(--bg-base)' : 'var(--bg-elevated)',
                          border: `1px solid ${item.is_read ? 'var(--border)' : kindMeta.border}`,
                          borderLeft: item.is_read ? '1px solid var(--border)' : `3px solid ${kindMeta.color}`,
                          cursor: 'pointer',
                          transition: 'all var(--t-fast)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: kindMeta.color,
                              background: kindMeta.bg,
                            }}
                          >
                            {kindMeta.label}
                          </span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </div>

                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: item.is_read ? 500 : 700, color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>

                        {item.body && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {item.body}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasUnread && (
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={CheckCheck}
                  onClick={handleMarkAllRead}
                  isLoading={markMutation.isPending}
                >
                  Mark all read
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
