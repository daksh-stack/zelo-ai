import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, Check, X, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Spinner';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { getPendingFriends, respondFriend } from '../../api/social';

export const PendingRequests = () => {
  const queryClient = useQueryClient();
  const [declineReq, setDeclineReq] = useState(null);

  const { data: pendingList = [], isLoading } = useQuery({
    queryKey: ['social', 'pending'],
    queryFn: getPendingFriends,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }) => respondFriend(id, accept),
    onSuccess: (data, variables) => {
      showToast(variables.accept ? 'Friend request accepted!' : 'Friend request declined.', 'info');
      setDeclineReq(null);
      queryClient.invalidateQueries({ queryKey: ['social', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'friends'] });
      queryClient.invalidateQueries({ queryKey: ['social', 'leaderboard'] });
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Action failed.', 'error');
    },
  });

  if (isLoading) {
    return <Skeleton height="80px" borderRadius="12px" />;
  }

  if (pendingList.length === 0) return null;

  return (
    <Card padding="18px" accent style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} color="var(--accent)" />
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Pending Friend Requests ({pendingList.length})
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pendingList.map((req) => (
          <div
            key={req.id}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {req.display_name || 'Warrior Cadet'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                Wants to add you to their friend squad
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant="primary"
                size="xs"
                leftIcon={Check}
                isLoading={respondMutation.isPending}
                onClick={() => respondMutation.mutate({ id: req.id, accept: true })}
              >
                Accept
              </Button>
              <Button
                variant="danger"
                size="xs"
                leftIcon={X}
                disabled={respondMutation.isPending}
                onClick={() => setDeclineReq(req)}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Decline Confirmation Modal */}
      <Modal
        isOpen={!!declineReq}
        onClose={() => setDeclineReq(null)}
        title="Confirm Decline Request"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Decline friend request from <strong>{declineReq?.display_name}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={() => setDeclineReq(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={respondMutation.isPending}
              onClick={() => respondMutation.mutate({ id: declineReq?.id, accept: false })}
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
