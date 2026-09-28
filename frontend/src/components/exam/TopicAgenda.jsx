import React from 'react';
import { CheckCircle2, Clock, PlayCircle, MinusCircle, AlertCircle } from 'lucide-react';

const IMPORTANCE_CONFIG = {
  must_know: {
    label: 'Must know',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  should_know: {
    label: 'Should know',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.35)',
  },
  low_priority: {
    label: 'If time',
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.12)',
    border: 'rgba(156, 163, 175, 0.25)',
  },
};

const STATUS_ICONS = {
  covered: { icon: CheckCircle2, color: 'var(--success)' },
  in_progress: { icon: PlayCircle, color: '#F97316' },
  pending: { icon: Clock, color: 'var(--text-tertiary)' },
  skipped: { icon: MinusCircle, color: 'var(--text-tertiary)' },
};

/**
 * TopicAgenda component
 * @param {Object} props
 * @param {Array} props.topics - List of topic objects
 * @param {string} props.selectedTopicId - Currently active topic ID
 * @param {Function} props.onSelectTopic - Callback when user clicks a topic
 */
export const TopicAgenda = ({ topics = [], selectedTopicId, onSelectTopic }) => {
  const sortedTopics = [...topics].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 4px' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Timed Topic Agenda ({sortedTopics.length})
        </span>
      </div>

      {sortedTopics.length === 0 ? (
        <div style={{ padding: '16px', textTransform: 'none', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          No topics in this session.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sortedTopics.map((topic) => {
            const isSelected = topic.id === selectedTopicId;
            const importance = IMPORTANCE_CONFIG[topic.importance] || IMPORTANCE_CONFIG.should_know;
            const statusInfo = STATUS_ICONS[topic.status] || STATUS_ICONS.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-lg)',
                  background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }
                }}
              >
                {/* Status indicator */}
                <StatusIcon size={16} color={statusInfo.color} style={{ flexShrink: 0 }} />

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textDecoration: topic.status === 'covered' ? 'line-through' : 'none',
                        opacity: topic.status === 'covered' || topic.status === 'skipped' ? 0.7 : 1,
                      }}
                    >
                      {topic.order ? `${topic.order}. ` : ''}{topic.title}
                    </span>
                  </div>
                  {topic.unit_name && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topic.unit_name}
                    </div>
                  )}
                </div>

                {/* Right side: Importance chip + time */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: importance.color,
                      background: importance.bg,
                      border: `1px solid ${importance.border}`,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {importance.label}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {topic.allocated_minutes || 30}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
