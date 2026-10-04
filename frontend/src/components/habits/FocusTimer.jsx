import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, CheckCircle2, XCircle, Zap, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { startFocus, getActiveFocus, finishFocus } from '../../api/habits';

export const FocusTimer = () => {
  const queryClient = useQueryClient();
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Hydrate active session from backend
  const { data: activeSession, refetch: refetchActive } = useQuery({
    queryKey: ['habits', 'activeFocus'],
    queryFn: getActiveFocus,
  });

  const isRunning = activeSession && activeSession.status === 'running';

  // Timer countdown computed strictly from started_at
  useEffect(() => {
    if (!isRunning || !activeSession?.started_at) {
      setSecondsLeft(0);
      return;
    }

    const startTime = new Date(activeSession.started_at).getTime();
    const durationMs = (activeSession.planned_minutes || 25) * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isRunning, activeSession]);

  // Start Focus Mutation
  const startMutation = useMutation({
    mutationFn: (mins) => startFocus(mins),
    onSuccess: () => {
      showToast('Focus mode activated! Direct your focus on active missions.', 'success');
      queryClient.invalidateQueries({ queryKey: ['habits', 'activeFocus'] });
      refetchActive();
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail;
      if (detail && detail.includes('already running')) {
        refetchActive();
      }
      showToast(detail || 'Failed to start focus mode.', 'error');
    },
  });

  // Finish / Abort Focus Mutation
  const finishMutation = useMutation({
    mutationFn: ({ sessionId, aborted }) => finishFocus(sessionId, aborted),
    onSuccess: (data, variables) => {
      if (variables.aborted) {
        showToast('Focus session aborted (0 XP).', 'info');
      } else {
        showToast(`+${data.xp_awarded} XP Earned in Focus Mode!`, 'success');
      }
      setShowAbortConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['habits', 'activeFocus'] });
      queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['habits', 'badges'] });
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to update focus session.', 'error');
    },
  });

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentMultiplier = selectedMinutes >= 45 ? 1.5 : 1.25;

  return (
    <Card padding="20px" glow={isRunning} glowColor="accent" accent>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Focus Mode Timer
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Deep work session with XP multiplier
              </p>
            </div>
          </div>

          <Badge variant={isRunning ? 'cyan' : 'muted'} icon={Zap}>
            {isRunning ? `${activeSession.xp_multiplier}× XP Multiplier` : `${currentMultiplier}× XP Multiplier`}
          </Badge>
        </div>

        {isRunning ? (
          /* Running State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-xl)', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '0.08em', lineHeight: 1 }}>
              {formatTime(secondsLeft)}
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '360px', margin: 0 }}>
              Stay on today’s tasks. Timer is local; XP is awarded when you finish.
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={CheckCircle2}
                isLoading={finishMutation.isPending}
                onClick={() => finishMutation.mutate({ sessionId: activeSession.id, aborted: false })}
                style={{ flex: 1 }}
              >
                Finish Session
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={XCircle}
                disabled={finishMutation.isPending}
                onClick={() => setShowAbortConfirm(true)}
              >
                Abort
              </Button>
            </div>
          </div>
        ) : (
          /* Idle State */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[15, 25, 45, 60].map((mins) => {
                const isSelected = selectedMinutes === mins;
                const mult = mins >= 45 ? '1.5×' : '1.25×';

                return (
                  <button
                    key={mins}
                    onClick={() => setSelectedMinutes(mins)}
                    style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '10px',
                      borderRadius: 'var(--radius-lg)',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>{mins}m</span>
                    <span style={{ fontSize: '0.62rem', color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: 700 }}>
                      {mult}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={Play}
              isLoading={startMutation.isPending}
              onClick={() => startMutation.mutate(selectedMinutes)}
            >
              Start {selectedMinutes}-Min Focus Session
            </Button>
          </div>
        )}
      </div>

      {/* Abort Confirmation Modal */}
      <Modal
        isOpen={showAbortConfirm}
        onClose={() => setShowAbortConfirm(false)}
        title="Confirm Abort Focus Session"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to abort this focus session? Aborting will yield <strong>0 XP</strong> for this session.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={() => setShowAbortConfirm(false)}>
              Keep Focusing
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={finishMutation.isPending}
              onClick={() => finishMutation.mutate({ sessionId: activeSession?.id, aborted: true })}
            >
              Abort (0 XP)
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
