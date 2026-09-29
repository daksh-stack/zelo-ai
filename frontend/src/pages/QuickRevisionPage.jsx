import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, RotateCcw, Filter, AlertCircle } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Spinner';
import { getQuickRevision } from '../api/skillPath';
import { RevisionCard } from '../components/skill/RevisionCard';

const FILTER_TOPICS = [
  { id: 'all', label: 'All Topics', value: '' },
  { id: 'dsa', label: 'DSA', value: 'dsa' },
  { id: 'os', label: 'OS', value: 'os' },
  { id: 'dbms', label: 'DBMS', value: 'dbms' },
  { id: 'system_design', label: 'System Design', value: 'system_design' },
];

export const QuickRevisionPage = () => {
  const [selectedTopics, setSelectedTopics] = useState([]); // array of topic ids e.g. ['dsa', 'os']
  const [cardIndex, setCardIndex] = useState(0);

  // Convert selected topics array to comma-separated query string
  const topicsParam = selectedTopics.join(',');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quickRevision', topicsParam],
    queryFn: () => getQuickRevision(topicsParam),
  });

  const cards = data?.cards || [];
  const totalCards = cards.length;

  const handleToggleTopic = (topicValue) => {
    setCardIndex(0);
    if (!topicValue) {
      setSelectedTopics([]);
      return;
    }

    if (selectedTopics.includes(topicValue)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicValue));
    } else {
      setSelectedTopics([...selectedTopics, topicValue]);
    }
  };

  const handleShuffle = () => {
    if (cards.length > 1) {
      // Pick a random index different from current
      let newIdx = Math.floor(Math.random() * cards.length);
      if (newIdx === cardIndex && cards.length > 1) {
        newIdx = (cardIndex + 1) % cards.length;
      }
      setCardIndex(newIdx);
    }
  };

  const currentCard = cards[cardIndex];

  return (
    <AppShell title="Quick Revision Decks">
      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Layers size={18} color="var(--accent)" />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Skill Path Retention
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Quick Revision
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Short recall. Weak areas first. Flip cards to reinforce memory retention.
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {FILTER_TOPICS.map((topic) => {
              const isAll = topic.id === 'all';
              const isSelected = isAll ? selectedTopics.length === 0 : selectedTopics.includes(topic.value);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleToggleTopic(topic.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--t-fast)',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border)'}`,
                  }}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
            <Skeleton height="320px" borderRadius="16px" />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton height="40px" width="120px" borderRadius="8px" />
              <Skeleton height="40px" width="120px" borderRadius="8px" />
            </div>
          </div>
        ) : isError ? (
          <Card padding="32px">
            <div style={{ textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--text-danger)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Failed to load revision cards
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px', marginBottom: '16px' }}>
                {error?.response?.data?.detail || 'Could not fetch flashcard deck.'}
              </p>
              <Button variant="secondary" leftIcon={RotateCcw} onClick={() => refetch()}>
                Retry Deck
              </Button>
            </div>
          </Card>
        ) : totalCards === 0 ? (
          <Card padding="32px">
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <Layers size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No cards for this filter.
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', marginTop: '4px', marginBottom: '16px' }}>
                Try selecting "All Topics" to view available retention cards.
              </p>
              <Button variant="secondary" onClick={() => setSelectedTopics([])}>
                Reset Topic Filter
              </Button>
            </div>
          </Card>
        ) : (
          <RevisionCard
            card={currentCard}
            cardIndex={cardIndex}
            totalCards={totalCards}
            onNext={() => setCardIndex((prev) => Math.min(prev + 1, totalCards - 1))}
            onPrev={() => setCardIndex((prev) => Math.max(prev - 1, 0))}
            onShuffle={handleShuffle}
          />
        )}
      </div>
    </AppShell>
  );
};
