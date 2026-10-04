import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Lock, Flame, Zap, Shield, Target, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Spinner';
import { getBadges } from '../../api/habits';

const BADGE_ICONS = {
  first_blood: Target,
  streak_7: Flame,
  streak_30: Flame,
  xp_500: Zap,
  xp_2000: Award,
  focus_10: Clock,
};

export const BadgeShelf = ({ compact = false }) => {
  const { data: catalog, isLoading, isError } = useQuery({
    queryKey: ['habits', 'badges'],
    queryFn: getBadges,
  });

  const earned = catalog?.earned || [];
  const locked = catalog?.locked || [];

  return (
    <Card padding={compact ? '18px' : '24px'} accent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="var(--xp)" />
          <h3 style={{ fontSize: compact ? 'var(--text-sm)' : 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Warrior Badge Shelf
          </h3>
        </div>
        <Badge variant="xp">
          {earned.length} Unlocked
        </Badge>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
          <Skeleton height="90px" borderRadius="12px" />
          <Skeleton height="90px" borderRadius="12px" />
          <Skeleton height="90px" borderRadius="12px" />
        </div>
      ) : isError ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px' }}>
          Unable to load badge shelf.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Earned Grid */}
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Earned Badges ({earned.length})
            </div>

            {earned.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
                No badges earned yet. Execute daily missions to earn your first blood!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(110px, 1fr))' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {earned.map((b) => {
                  const IconComp = BADGE_ICONS[b.code] || Award;
                  const dateStr = b.earned_at
                    ? new Date(b.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Unlocked';

                  return (
                    <div
                      key={b.code}
                      title={b.description}
                      style={{
                        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.12) 0%, var(--bg-elevated) 100%)',
                        border: '1px solid rgba(167, 139, 250, 0.35)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '12px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'rgba(167, 139, 250, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={18} color="var(--xp)" />
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--xp)', fontWeight: 600 }}>
                        {dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Locked Grid */}
          {!compact && locked.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Locked Badges ({locked.length})
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {locked.map((b) => {
                  const IconComp = BADGE_ICONS[b.code] || Award;

                  return (
                    <div
                      key={b.code}
                      title={`${b.title}: ${b.description}`}
                      style={{
                        background: 'var(--bg-base)',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '12px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '6px',
                        opacity: 0.4,
                      }}
                    >
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Lock size={16} color="var(--text-tertiary)" />
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
                        {b.title}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                        {b.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
