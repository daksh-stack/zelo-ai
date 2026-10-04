import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, KeyRound, Copy, Check, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Spinner';
import { showToast } from '../ui/Toast';
import { getCircles, createCircle, joinCircle } from '../../api/social';

export const CirclePanel = ({ selectedCircleId, onSelectCircle }) => {
  const queryClient = useQueryClient();
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const { data: circles = [], isLoading } = useQuery({
    queryKey: ['social', 'circles'],
    queryFn: getCircles,
  });

  const createMutation = useMutation({
    mutationFn: (name) => createCircle(name),
    onSuccess: (data) => {
      showToast(`Circle "${data.name}" created! Code: ${data.invite_code}`, 'success');
      setCreateName('');
      queryClient.invalidateQueries({ queryKey: ['social', 'circles'] });
      if (onSelectCircle) onSelectCircle(data.id);
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to create circle.', 'error');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code) => joinCircle(code),
    onSuccess: (data) => {
      showToast(`Joined circle "${data.name}"!`, 'success');
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['social', 'circles'] });
      if (onSelectCircle) onSelectCircle(data.id);
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to join circle.', 'error');
    },
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Invite code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Card padding="24px" accent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={20} color="var(--accent)" />
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Study Circles (Max 8 Members)
        </h3>
      </div>

      {/* Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Create Circle */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (createName.trim()) createMutation.mutate(createName.trim());
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Input
            placeholder="Circle name (e.g. Night Shift)"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={Plus}
            isLoading={createMutation.isPending}
            disabled={!createName.trim()}
          >
            Create Circle
          </Button>
        </form>

        {/* Join Circle */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (joinCode.trim()) joinMutation.mutate(joinCode.trim());
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <Input
            placeholder="6-char invite code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            icon={KeyRound}
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={joinMutation.isPending}
            disabled={!joinCode.trim()}
          >
            Join Circle
          </Button>
        </form>
      </div>

      {/* My Circles List */}
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          My Circles ({circles.length})
        </div>

        {isLoading ? (
          <Skeleton height="60px" borderRadius="12px" />
        ) : circles.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
            You haven't joined or created any circles yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {circles.map((c) => {
              const isSelected = selectedCircleId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCircle && onSelectCircle(c.id)}
                  style={{
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {c.name}
                    </span>
                    {isSelected && <Badge variant="cyan">Selected</Badge>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    <span>Code: <strong style={{ color: 'var(--accent)' }}>{c.invite_code}</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(c.invite_code);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Copy invite code"
                    >
                      {copiedCode === c.invite_code ? <Check size={12} /> : <Copy size={12} />}
                      <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        {copiedCode === c.invite_code ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
