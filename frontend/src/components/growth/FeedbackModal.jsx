import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, Bug, Lightbulb, Zap, HelpCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';
import { sendFeedback, getAppConfig } from '../../api/growth';
import { trackEvent } from '../../lib/trackEvent';

const CATEGORIES = [
  { id: 'general', label: 'General', icon: HelpCircle, color: 'var(--accent)' },
  { id: 'bug', label: 'Bug', icon: Bug, color: '#EF4444' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'var(--xp)' },
  { id: 'exam', label: 'Exam Rescue', icon: Zap, color: 'var(--streak)' },
];

export const FeedbackModal = ({ isOpen, onClose, defaultCategory = 'general' }) => {
  const [category, setCategory] = useState(defaultCategory);
  const [message, setMessage] = useState('');

  const { data: config } = useQuery({
    queryKey: ['growth', 'config'],
    queryFn: getAppConfig,
    staleTime: Infinity,
    retry: false,
  });

  const feedbackMutation = useMutation({
    mutationFn: (payload) => sendFeedback(payload),
    onSuccess: () => {
      showToast('Logged. We read every dispatch.', 'success');
      trackEvent('feedback_sent', { category });
      setMessage('');
      onClose();
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to submit feedback.';
      showToast(detail, 'error');
    },
  });

  if (config?.features?.feedback === false) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      showToast('Feedback message must be at least 5 characters.', 'error');
      return;
    }
    feedbackMutation.mutate({
      category,
      message: message.trim(),
      page: window.location.pathname,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Dispatch / Feedback" maxWidth="480px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Category
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {CATEGORIES.map((cat) => {
              const isSel = category === cat.id;
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-md)',
                    background: isSel ? 'var(--bg-elevated)' : 'var(--bg-base)',
                    border: `1px solid ${isSel ? cat.color : 'var(--border)'}`,
                    color: isSel ? cat.color : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    fontWeight: isSel ? 700 : 500,
                    transition: 'all var(--t-fast)',
                  }}
                >
                  <IconComp size={16} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Message (5–2000 chars)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share feature ideas, report bugs, or request rescue modules..."
            rows={4}
            maxLength={2000}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            <span>Auto-tagged page: {window.location.pathname}</span>
            <span>{message.length} / 2000</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leftIcon={Send}
            isLoading={feedbackMutation.isPending}
            disabled={message.trim().length < 5}
          >
            Submit Dispatch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
