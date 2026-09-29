import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight, Shuffle, Eye, EyeOff, Zap, Tag, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

/**
 * RevisionCard Component
 * Single flashcard with flip interaction, tags, and keyboard control
 */
export const RevisionCard = ({ card, cardIndex, totalCards, onNext, onPrev, onShuffle }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when cardIndex changes
  useEffect(() => {
    setIsFlipped(false);
  }, [cardIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);

  if (!card) return null;

  const isWeakArea = card.source === 'weak_area';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      {/* Top Deck Stats & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Card {cardIndex + 1} of {totalCards}
          </span>
          {isWeakArea && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={11} fill="#F59E0B" />
              Weak Area Focus
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onShuffle}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--accent-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <Shuffle size={13} />
          <span>Shuffle Deck</span>
        </button>
      </div>

      {/* Main Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          cursor: 'pointer',
          perspective: '1000px',
          minHeight: '320px',
        }}
      >
        <motion.div
          key={cardIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            padding="32px"
            accent={isFlipped}
            glow={isFlipped}
            glowColor="accent"
            style={{
              minHeight: '320px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: isFlipped ? 'rgba(56, 189, 248, 0.04)' : 'var(--bg-surface)',
              border: `1px solid ${isFlipped ? 'var(--accent-border)' : 'var(--border)'}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Tag & Topic Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Topic: <span style={{ color: 'var(--accent)' }}>{card.topic || 'General'}</span>
                </span>

                {card.tag && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                    }}
                  >
                    #{card.tag}
                  </span>
                )}
              </div>

              {/* Front or Back Content */}
              <AnimatePresence mode="wait">
                {!isFlipped ? (
                  <motion.div
                    key="front"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Prompt / Question
                    </div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {card.front}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="var(--success)" />
                      Key Answer / Concept
                    </div>
                    <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', lineHeight: 1.6, whitespace: 'pre-line' }}>
                      {card.back}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Flip Hint */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {!isFlipped ? 'Click card or press [Space] to reveal answer' : 'Click card or press [Space] to view prompt'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)' }}>
                {!isFlipped ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{!isFlipped ? 'Reveal Answer' : 'Hide Answer'}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Card Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <Button
          variant="secondary"
          size="md"
          leftIcon={ChevronLeft}
          disabled={cardIndex === 0}
          onClick={onPrev}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={isFlipped ? EyeOff : Eye}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {isFlipped ? 'Hide Answer' : 'Reveal Answer'}
        </Button>

        <Button
          variant="primary"
          size="md"
          rightIcon={ChevronRight}
          disabled={cardIndex === totalCards - 1}
          onClick={onNext}
        >
          Next Card
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
        Keyboard Shortcuts: <code style={{ fontSize: '0.65rem', padding: '1px 4px' }}>[Space]</code> Flip · <code style={{ fontSize: '0.65rem', padding: '1px 4px' }}>[←]</code> Prev · <code style={{ fontSize: '0.65rem', padding: '1px 4px' }}>[→]</code> Next
      </div>
    </div>
  );
};
