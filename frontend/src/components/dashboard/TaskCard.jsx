import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Circle,
  AlertCircle,
  SkipForward,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const TaskCard = ({ task, onComplete, onTestUnderstanding, onQuizTask, isPendingAction = false, isFirstPending = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showXpFlash, setShowXpFlash] = useState(false);

  const isDone = task.status === 'done';
  const isPartial = task.status === 'partial';
  const isSkipped = task.status === 'skipped';

  const handleAction = (status) => {
    if (isPendingAction) return;
    if (status === 'done') {
      setShowXpFlash(true);
      setTimeout(() => setShowXpFlash(false), 1100);
    }
    onComplete(task.id, status);
  };

  const borderColor = isFirstPending
    ? 'var(--accent)'
    : isDone
      ? 'var(--success-border)'
      : 'var(--border)';

  const bgColor = isDone
    ? 'rgba(34,197,94,0.03)'
    : isSkipped
      ? 'var(--bg-base)'
      : 'var(--bg-surface)';

  return (
    <motion.div
      id={`task-card-${task.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: 'relative',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        boxShadow: isFirstPending
          ? `0 0 0 1px var(--accent-border), var(--shadow-sm)`
          : 'var(--shadow-sm)',
        transition: `border-color var(--t-base), box-shadow var(--t-base)`,
      }}
    >
      {/* Active mission pulse indicator */}
      {isFirstPending && !isDone && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: '2px',
            background: 'var(--accent)',
            borderRadius: '0 2px 2px 0',
            boxShadow: '0 0 6px var(--accent-glow)',
          }}
        />
      )}

      {/* XP flash animation */}
      <AnimatePresence>
        {showXpFlash && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -32, scale: 1 }}
            exit={{ opacity: 0, y: -52 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              zIndex: 10,
              background: 'var(--success)',
              color: '#0C0E11',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 800,
              fontSize: 'var(--text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              pointerEvents: 'none',
              boxShadow: '0 2px 12px var(--success-dim)',
            }}
          >
            <Zap size={12} fill="#0C0E11" />
            +{task.xp_value} XP
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Status toggle */}
        <button
          style={{
            marginTop: '1px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: isDone ? 'default' : 'pointer',
            flexShrink: 0,
          }}
          onClick={() => !isDone && handleAction('done')}
          title={isDone ? 'Mission complete' : 'Mark as done'}
        >
          {isDone ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 size={22} color="var(--success)" />
            </motion.div>
          ) : isPartial ? (
            <AlertCircle size={22} color="#FBBF24" />
          ) : isSkipped ? (
            <SkipForward size={22} color="var(--text-tertiary)" />
          ) : (
            <Circle size={22} color={isFirstPending ? 'var(--accent)' : 'var(--text-tertiary)'} />
          )}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <h4
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                textDecoration: isDone ? 'line-through' : 'none',
                letterSpacing: '-0.01em',
                lineHeight: 1.35,
              }}
            >
              {task.title}
            </h4>

            {/* Meta badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Badge variant="muted" icon={Clock}>
                {task.estimated_minutes}m
              </Badge>
              <Badge variant={isDone ? 'success' : 'xp'} icon={Zap}>
                +{task.xp_value}
              </Badge>
              {task.resource_url && (
                <a
                  href={task.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    textDecoration: 'none',
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-dim)'}
                >
                  Resource
                  <ExternalLink size={11} />
                </a>
              )}
              {isDone && onQuizTask && (
                <button
                  onClick={() => onQuizTask(task)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                    cursor: 'pointer',
                    transition: 'background var(--t-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56,189,248,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-dim)'}
                  title="Take optional post-task retention question"
                >
                  <HelpCircle size={11} />
                  <span>Quick check (optional)</span>
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginTop: '8px' }}>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: isDone ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  lineHeight: 1.55,
                  display: isExpanded ? 'block' : '-webkit-box',
                  WebkitLineClamp: isExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: isExpanded ? 'visible' : 'hidden',
                }}
              >
                {task.description}
              </p>
              {task.description.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    marginTop: '4px',
                    padding: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {isExpanded
                    ? <><span>Show less</span><ChevronUp size={13} /></>
                    : <><span>Read more</span><ChevronDown size={13} /></>
                  }
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          {!isDone && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              <Button
                size="sm"
                variant="primary"
                leftIcon={CheckCircle2}
                isLoading={isPendingAction}
                onClick={() => handleAction('done')}
              >
                Complete Mission
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={AlertCircle}
                isLoading={isPendingAction}
                onClick={() => handleAction('partial')}
              >
                Partial
              </Button>
              {onTestUnderstanding && (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={Lightbulb}
                  onClick={() => onTestUnderstanding(task)}
                >
                  Test understanding
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                leftIcon={SkipForward}
                isLoading={isPendingAction}
                onClick={() => handleAction('skipped')}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
