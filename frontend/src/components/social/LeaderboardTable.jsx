import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Zap, Shield, Users, School, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Spinner';
import { getLeaderboard } from '../../api/social';

export const LeaderboardTable = ({ circleId = null, circlesList = [] }) => {
  const navigate = useNavigate();
  const [scope, setScope] = useState('friends'); // 'friends' | 'college' | 'circle'
  const [activeCircleId, setActiveCircleId] = useState(circleId);

  const currentCircleId = activeCircleId || circleId || circlesList[0]?.id;

  const { data: leaderboardData, isLoading, isError, error } = useQuery({
    queryKey: ['social', 'leaderboard', scope, scope === 'circle' ? currentCircleId : null],
    queryFn: () => getLeaderboard(scope, currentCircleId),
    enabled: scope !== 'circle' || Boolean(currentCircleId),
    retry: false,
  });

  const rows = leaderboardData?.rows || [];

  return (
    <Card padding="24px" accent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Scope Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={20} color="var(--accent)" />
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Accountability Leaderboard
          </h3>
        </div>

        {/* Scope Toggle Pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setScope('friends')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              background: scope === 'friends' ? 'var(--accent)' : 'transparent',
              color: scope === 'friends' ? '#0C0E11' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
          >
            Friends
          </button>
          <button
            onClick={() => setScope('college')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              background: scope === 'college' ? 'var(--accent)' : 'transparent',
              color: scope === 'college' ? '#0C0E11' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
          >
            College
          </button>
          <button
            onClick={() => setScope('circle')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              background: scope === 'circle' ? 'var(--accent)' : 'transparent',
              color: scope === 'circle' ? '#0C0E11' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
          >
            Circle
          </button>
        </div>
      </div>

      {/* Circle Scope Sub-Selector */}
      {scope === 'circle' && circlesList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            Select Circle:
          </span>
          <select
            value={currentCircleId || ''}
            onChange={(e) => setActiveCircleId(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
            }}
          >
            {circlesList.map((c) => (
              <option key={c.id} value={c.id} style={{ background: '#111418' }}>
                {c.name} ({c.invite_code})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Table Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height="45px" borderRadius="10px" />
          <Skeleton height="45px" borderRadius="10px" />
          <Skeleton height="45px" borderRadius="10px" />
        </div>
      ) : scope === 'college' && isError ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <School size={32} color="var(--accent)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
            {error?.response?.data?.detail || 'Set college and opt in to the board first'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '16px' }}>
            Set your institution name and turn on College Board Opt-In to view your campus ranks.
          </div>
          <Button variant="primary" size="sm" rightIcon={ArrowRight} onClick={() => navigate('/profile')}>
            Opt In on Profile
          </Button>
        </div>
      ) : scope === 'circle' && !currentCircleId ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <Users size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pick a Circle to view standings
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          No warriors found on this leaderboard yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '8px 12px', width: '60px' }}>Rank</th>
                <th style={{ padding: '8px 12px' }}>Callsign</th>
                <th style={{ padding: '8px 12px' }}>Streak</th>
                <th style={{ padding: '8px 12px' }}>XP Total</th>
                <th style={{ padding: '8px 12px' }}>Level</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMe = row.is_me === true;
                const rankNum = row.rank ?? '-';

                return (
                  <tr
                    key={row.user_id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isMe ? 'var(--accent-dim)' : 'transparent',
                      transition: 'background var(--t-fast)',
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px', fontWeight: 800, fontSize: 'var(--text-sm)', color: rankNum === 1 ? '#FBBF24' : isMe ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      #{rankNum}
                    </td>

                    {/* Callsign / Name */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: isMe ? 800 : 600, color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {row.display_name}
                        </span>
                        {isMe && <Badge variant="cyan">You</Badge>}
                      </div>
                      {row.college && (
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {row.college}
                        </div>
                      )}
                    </td>

                    {/* Streak */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={14} color="var(--streak)" fill="var(--streak)" />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--streak)' }}>
                          {row.current_streak}d
                        </span>
                      </div>
                    </td>

                    {/* XP */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={14} color="var(--xp)" />
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--xp)' }}>
                          {row.total_xp}
                        </span>
                      </div>
                    </td>

                    {/* Level */}
                    <td style={{ padding: '12px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Lv.{row.level}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
