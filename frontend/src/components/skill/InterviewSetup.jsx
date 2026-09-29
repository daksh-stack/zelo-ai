import React, { useState } from 'react';
import { MessageSquare, Code, Server, Layout, Cpu, Layers, ArrowRight, Shield, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const DOMAIN_OPTIONS = [
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    badge: 'Core Problem Solving',
    description: 'Arrays, trees, graphs, dynamic programming, and complexity analysis.',
    icon: Code,
  },
  {
    id: 'backend',
    title: 'Backend Engineering',
    badge: 'API & Databases',
    description: 'REST/gRPC, concurrency, database indexing, caching, and ORMs.',
    icon: Server,
  },
  {
    id: 'frontend',
    title: 'Frontend Engineering',
    badge: 'UI Architect',
    description: 'React internals, DOM optimization, state management, and web performance.',
    icon: Layout,
  },
  {
    id: 'system_design',
    title: 'System Design',
    badge: 'Scalability & Infra',
    description: 'Microservices, load balancing, sharding, message queues, and availability.',
    icon: Cpu,
  },
  {
    id: 'sde',
    title: 'General SDE',
    badge: 'Full-Spectrum',
    description: 'Mixed technical questions covering OOP, design patterns, and debugging.',
    icon: Layers,
  },
];

const QUESTION_COUNTS = [3, 5, 8];

/**
 * InterviewSetup Component
 * Form setup for launching a new interview practice session
 */
export const InterviewSetup = ({ onStart, isLoading }) => {
  const [selectedDomain, setSelectedDomain] = useState('dsa');
  const [questionCount, setQuestionCount] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({ domain: selectedDomain, total_questions: Number(questionCount) });
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Intro Banner */}
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
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--accent) 0%, #818CF8 100%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquare size={18} color="#0C0E11" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Interactive AI Interview Simulator
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Interview Practice Mode
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          Answer like a real interview. Short, structured, honest. Get instant scoring, precise feedback, and model answers.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Step 1 — Select Domain */}
        <Card padding="24px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Step 1 — Domain Focus
              </div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Select target interview domain
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {DOMAIN_OPTIONS.map((dom) => {
                const isSelected = selectedDomain === dom.id;
                const Icon = dom.icon;
                return (
                  <div
                    key={dom.id}
                    onClick={() => setSelectedDomain(dom.id)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-xl)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--t-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Icon size={20} color={isSelected ? 'var(--accent)' : 'var(--text-secondary)'} />
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', textTransform: 'uppercase' }}>
                        {dom.badge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {dom.title}
                    </h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                      {dom.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Step 2 — Question Count */}
        <Card padding="24px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                Step 2 — Session Length
              </div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                How many questions for this session?
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {QUESTION_COUNTS.map((count) => {
                const isSelected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all var(--t-fast)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{count}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      {count === 3 ? 'Quick Drill' : count === 5 ? 'Standard' : 'Full Mock'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Start CTA */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          rightIcon={ArrowRight}
          isLoading={isLoading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 'var(--text-md)',
            fontWeight: 800,
            borderRadius: 'var(--radius-xl)',
          }}
        >
          {isLoading ? 'Setting up mock interview room...' : 'Start Mock Interview →'}
        </Button>
      </form>
    </div>
  );
};
