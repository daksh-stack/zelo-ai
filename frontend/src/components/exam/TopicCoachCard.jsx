import React, { useState } from 'react';
import { CheckCircle2, FastForward, Play, ChevronDown, ChevronUp, Zap, HelpCircle, FileText, Bookmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const IMPORTANCE_CONFIG = {
  must_know: {
    label: 'Must know',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  should_know: {
    label: 'Should know',
    color: '#F97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.4)',
  },
  low_priority: {
    label: 'If time',
    color: '#9CA3AF',
    bg: 'rgba(156, 163, 175, 0.15)',
    border: 'rgba(156, 163, 175, 0.3)',
  },
};

/**
 * TopicCoachCard Component
 * @param {Object} props
 * @param {Object} props.topic - Topic object
 * @param {Function} props.onUpdateStatus - Callback(topicId, status)
 * @param {boolean} props.isUpdating - Loading flag for status mutation
 */
export const TopicCoachCard = ({ topic, onUpdateStatus, isUpdating }) => {
  const [expandedQIndex, setExpandedQIndex] = useState(null);

  if (!topic) {
    return (
      <Card padding="32px">
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '24px 0' }}>
          <FileText size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Select a topic from the agenda
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
            Focus on high-yield units to maximize marks tonight.
          </p>
        </div>
      </Card>
    );
  }

  const importance = IMPORTANCE_CONFIG[topic.importance] || IMPORTANCE_CONFIG.should_know;

  const toggleQuestion = (idx) => {
    setExpandedQIndex(expandedQIndex === idx ? null : idx);
  };

  const isCovered = topic.status === 'covered';
  const isSkipped = topic.status === 'skipped';
  const isInProgress = topic.status === 'in_progress';
  const isPending = topic.status === 'pending';

  // Normalize key_formulas
  const keyFormulas = Array.isArray(topic.key_formulas) ? topic.key_formulas : [];

  // Normalize likely_questions
  const likelyQuestions = Array.isArray(topic.likely_questions) ? topic.likely_questions : [];

  return (
    <Card padding="24px" accent={topic.importance === 'must_know'} glow={topic.importance === 'must_know'} glowColor="danger">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: importance.color,
                  background: importance.bg,
                  border: `1px solid ${importance.border}`,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {importance.label}
              </span>
              {topic.unit_name && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  Unit: <span style={{ color: 'var(--text-secondary)' }}>{topic.unit_name}</span>
                </span>
              )}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>·</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                ⏱ {topic.allocated_minutes || 30} mins
              </span>
            </div>

            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              {topic.order ? `${topic.order}. ` : ''}{topic.title}
            </h2>
          </div>

          {/* Status badge if done */}
          {isCovered && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--success-dim)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                color: 'var(--success)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={14} />
              <span>Covered (+15 XP)</span>
            </div>
          )}

          {isSkipped && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
              }}
            >
              <span>Skipped</span>
            </div>
          )}
        </div>

        {/* Compressed Notes / Summary */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <FileText size={15} color="#F97316" />
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Compressed Coach Notes
            </h4>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.6, whitespace: 'pre-line' }}>
            {topic.notes_summary || 'No compressed notes available for this topic.'}
          </div>
        </div>

        {/* Key Formulas & Critical Facts */}
        {keyFormulas.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Zap size={15} color="var(--accent)" />
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Key Formulas & Core Facts ({keyFormulas.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {keyFormulas.map((item, idx) => {
                const text = typeof item === 'string' ? item : item.item || item.formula || JSON.stringify(item);
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      fontSize: 'var(--text-sm)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {text}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Likely Questions Accordion */}
        {likelyQuestions.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <HelpCircle size={15} color="#A78BFA" />
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Likely Exam Questions & Model Answers ({likelyQuestions.length})
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {likelyQuestions.map((qObj, idx) => {
                const questionText = typeof qObj === 'string' ? qObj : qObj.q || qObj.question;
                const answerText = typeof qObj === 'object' ? qObj.a || qObj.answer : null;
                const isExpanded = expandedQIndex === idx;

                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${isExpanded ? 'rgba(167, 139, 250, 0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestion(idx)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        gap: '10px',
                      }}
                    >
                      <span style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#A78BFA', fontWeight: 700, flexShrink: 0 }}>Q{idx + 1}.</span>
                        <span>{questionText}</span>
                      </span>
                      {answerText && (
                        isExpanded ? <ChevronUp size={16} color="#A78BFA" /> : <ChevronDown size={16} color="var(--text-tertiary)" />
                      )}
                    </button>

                    {isExpanded && answerText && (
                      <div
                        style={{
                          padding: '0 14px 14px',
                          borderTop: '1px solid var(--border)',
                          background: 'rgba(167, 139, 250, 0.04)',
                          marginTop: '4px',
                        }}
                      >
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#A78BFA', margin: '8px 0 4px', textTransform: 'uppercase' }}>
                          Model Answer / Key Points:
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, whitespace: 'pre-line' }}>
                          {answerText}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Start topic action (if pending) */}
            {isPending && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Play}
                isLoading={isUpdating}
                onClick={() => onUpdateStatus(topic.id, 'in_progress')}
              >
                Start Studying
              </Button>
            )}

            {/* Mark Covered button */}
            <Button
              size="sm"
              variant="primary"
              leftIcon={CheckCircle2}
              disabled={isCovered}
              isLoading={isUpdating}
              onClick={() => onUpdateStatus(topic.id, 'covered')}
              style={{
                background: isCovered ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
                borderColor: isCovered ? 'var(--border)' : '#EF4444',
                color: isCovered ? 'var(--text-tertiary)' : '#FFF',
              }}
            >
              {isCovered ? 'Topic Covered' : 'Mark Topic Covered (+15 XP)'}
            </Button>

            {/* Skip button */}
            {!isCovered && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={FastForward}
                isLoading={isUpdating}
                onClick={() => onUpdateStatus(topic.id, 'skipped')}
                style={{ color: isSkipped ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
              >
                {isSkipped ? 'Skipped' : 'Skip Topic'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
