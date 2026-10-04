import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, UserCheck, School, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { getSocialMe, patchSocialMe } from '../../api/social';

export const SocialIdentityForm = () => {
  const queryClient = useQueryClient();

  const { data: socialMe, isLoading } = useQuery({
    queryKey: ['socialMe'],
    queryFn: getSocialMe,
  });

  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');
  const [boardOptIn, setBoardOptIn] = useState(false);

  useEffect(() => {
    if (socialMe) {
      if (socialMe.display_name) setDisplayName(socialMe.display_name);
      if (socialMe.college) setCollege(socialMe.college);
      setBoardOptIn(Boolean(socialMe.board_opt_in));
    }
  }, [socialMe]);

  const patchMutation = useMutation({
    mutationFn: (body) => patchSocialMe(body),
    onSuccess: (data) => {
      showToast('Social identity updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['socialMe'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'leaderboard'] });
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to update social identity.';
      showToast(detail, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    patchMutation.mutate({
      display_name: displayName.trim() || null,
      college: college.trim() || null,
      board_opt_in: boardOptIn,
    });
  };

  if (isLoading) {
    return <Skeleton height="220px" borderRadius="16px" />;
  }

  return (
    <Card padding="24px" accent>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--accent)" />
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Social Identity & Accountability
            </h3>
          </div>
          <Badge variant={boardOptIn ? 'cyan' : 'muted'} icon={boardOptIn ? Eye : EyeOff}>
            {boardOptIn ? 'College Board Public' : 'Private Mode'}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Warrior Callsign / Display Name"
            placeholder="e.g. Arjun_X"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="College / Institution"
            placeholder="e.g. VJTI"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
        </div>

        {/* Board Opt-in Toggle */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Appear on College Leaderboard
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Off by default. Only opted-in students at the same college string are ranked. Email is never shown.
            </div>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={boardOptIn}
              onChange={(e) => setBoardOptIn(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: boardOptIn ? 'var(--accent)' : 'var(--bg-surface)',
                border: `1px solid ${boardOptIn ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: '24px',
                transition: 'var(--t-fast)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px', width: '18px',
                  left: boardOptIn ? '22px' : '3px',
                  bottom: '2px',
                  background: boardOptIn ? '#0C0E11' : 'var(--text-tertiary)',
                  borderRadius: '50%',
                  transition: 'var(--t-fast)',
                }}
              />
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={Save}
            isLoading={patchMutation.isPending}
          >
            Save Identity Settings
          </Button>
        </div>
      </form>
    </Card>
  );
};
