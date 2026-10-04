import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Snowflake } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { useStreakFreeze } from '../../api/habits';

export const FreezeButton = ({ freezesRemaining = 0, currentStreak = 0, size = 'sm', variant = 'secondary' }) => {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showConfirm) {
        setShowConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfirm]);

  const freezeMutation = useMutation({
    mutationFn: useStreakFreeze,
    onSuccess: (data) => {
      showToast(`Streak protected! Saved ${data.saved_day || 'yesterday'}.`, 'success');
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'weekly'] });
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to apply streak freeze.';
      showToast(detail, 'error');
    },
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        leftIcon={Snowflake}
        disabled={freezesRemaining <= 0 || freezeMutation.isPending}
        isLoading={freezeMutation.isPending}
        onClick={() => setShowConfirm(true)}
        style={{
          borderColor: 'var(--accent-border)',
          color: 'var(--accent)',
          fontSize: 'var(--text-xs)',
        }}
        title={freezesRemaining > 0 ? 'Protect your streak' : 'No streak freezes remaining'}
      >
        Use freeze ({freezesRemaining})
      </Button>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Protect Streak with Freeze"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Spend 1 Streak Freeze?
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Spend 1 freeze to protect yesterday. Streak stays {currentStreak} days.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={freezeMutation.isPending}
              onClick={() => freezeMutation.mutate()}
            >
              Confirm & Protect
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
