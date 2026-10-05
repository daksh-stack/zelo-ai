import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Clock, ShieldAlert, Sparkles, Globe } from 'lucide-react';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { getAppConfig, getGrowthPrefs, patchGrowthPrefs } from '../../api/growth';

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={{
      position: 'relative',
      width: '40px',
      height: '22px',
      borderRadius: '11px',
      background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
      border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background var(--t-fast), border-color var(--t-fast)',
      padding: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '20px' : '2px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: checked ? '#0C0E11' : 'var(--text-tertiary)',
        transition: 'left var(--t-fast)',
      }}
    />
  </button>
);

export const ReminderPrefs = () => {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['growth', 'config'],
    queryFn: getAppConfig,
    staleTime: Infinity,
    retry: false,
  });

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['growth', 'prefs'],
    queryFn: getGrowthPrefs,
  });

  const patchMutation = useMutation({
    mutationFn: (body) => patchGrowthPrefs(body),
    onSuccess: (updated) => {
      showToast('Reminder parameters updated', 'success');
      queryClient.setQueryData(['growth', 'prefs'], updated);
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to update preferences';
      showToast(detail, 'error');
    },
  });

  // Hide if features.reminders === false
  if (config?.features?.reminders === false) {
    return null;
  }

  const browserTimezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata';
  const timezone = prefs?.timezone || browserTimezone;

  const handleToggle = (key, currentVal) => {
    patchMutation.mutate({
      [key]: !currentVal,
      timezone,
    });
  };

  const handleHourChange = (newHour) => {
    patchMutation.mutate({
      reminder_hour: Number(newHour),
      timezone,
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card padding="24px" accent>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Dispatch & Nudge Parameters
            </h3>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Zelo will drop an in-app dispatch if you have not completed a task by this hour. No spam email in v1.
          </p>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Daily Mission Reminder */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Daily Mission Reminder
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  In-app nudge when tasks remain incomplete
                </div>
              </div>
              <ToggleSwitch
                checked={prefs?.daily_reminder ?? true}
                onChange={() => handleToggle('daily_reminder', prefs?.daily_reminder ?? true)}
                disabled={patchMutation.isPending}
              />
            </div>

            {/* Streak Risk */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Streak at Risk Nudge
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  Alert before day-change if zero tasks are cleared
                </div>
              </div>
              <ToggleSwitch
                checked={prefs?.streak_risk ?? true}
                onChange={() => handleToggle('streak_risk', prefs?.streak_risk ?? true)}
                disabled={patchMutation.isPending}
              />
            </div>

            {/* Challenge Updates */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Challenge & Squad Updates
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  Notifications on weekly challenges & circle activity
                </div>
              </div>
              <ToggleSwitch
                checked={prefs?.challenge_updates ?? true}
                onChange={() => handleToggle('challenge_updates', prefs?.challenge_updates ?? true)}
                disabled={patchMutation.isPending}
              />
            </div>

            {/* Hour select & Timezone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Clock size={13} />
                  Reminder Hour
                </label>
                <select
                  value={prefs?.reminder_hour ?? 20}
                  onChange={(e) => handleHourChange(e.target.value)}
                  disabled={patchMutation.isPending}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {hours.map((h) => {
                    const label = `${String(h).padStart(2, '0')}:00`;
                    return (
                      <option key={h} value={h} style={{ background: '#111418' }}>
                        {label} {h === 20 ? '(Default)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Globe size={13} />
                  Detected Timezone
                </label>
                <div
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-tertiary)',
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-mono, monospace)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {timezone}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
