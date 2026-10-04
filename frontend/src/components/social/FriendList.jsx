import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Flame, Zap, Shield, Mail } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { getFriends, requestFriend } from '../../api/social';

export const FriendList = () => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');

  const { data: friendsList = [], isLoading } = useQuery({
    queryKey: ['social', 'friends'],
    queryFn: getFriends,
  });

  const requestMutation = useMutation({
    mutationFn: (e) => requestFriend(e),
    onSuccess: () => {
      showToast('Friend request sent!', 'success');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['social', 'pending'] });
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to send request.';
      showToast(detail, 'error');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!email.trim() || requestMutation.isPending) return;
    requestMutation.mutate(email.trim());
  };

  return (
    <Card padding="24px" accent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Add Friend Form */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Users size={20} color="var(--accent)" />
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Squad Friends ({friendsList.length})
          </h3>
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Friend's account email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              icon={Mail}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={UserPlus}
            isLoading={requestMutation.isPending}
            disabled={!email.trim()}
          >
            Send Request
          </Button>
        </form>
      </div>

      {/* Friends List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height="60px" borderRadius="12px" />
          <Skeleton height="60px" borderRadius="12px" />
        </div>
      ) : friendsList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)' }}>
          <Users size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
            No squad friends added yet
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            Invite a classmate by the email they used to register.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {friendsList.map((f) => (
            <div
              key={f.user_id}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {f.display_name}
                </div>
                {f.college && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {f.college}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={15} color="var(--streak)" fill="var(--streak)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--streak)' }}>
                    {f.current_streak}d
                  </span>
                </div>

                <Badge variant="xp" icon={Zap}>
                  {f.total_xp} XP (Lv.{f.level})
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
