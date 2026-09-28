import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Flame, Clock, Zap, Check, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { createExamSession, listExamSessions } from '../api/examRescue';

const SUBJECT_PRESETS = ['OS', 'DBMS', 'CN', 'DSA', 'COA'];

const STRATEGIES = [
  {
    id: 'high_yield',
    title: 'High-yield only',
    badge: 'Recommended',
    description: 'Must-know + should-know units. Highest marks return per hour studied.',
    icon: Zap,
    color: '#EF4444',
  },
  {
    id: 'full_pass',
    title: 'Full syllabus pass',
    badge: 'Comprehensive',
    description: 'Thin pass over all units. Ensures no chapter is left completely blank.',
    icon: Flame,
    color: '#F97316',
  },
];

export const ExamRescueSetup = () => {
  const navigate = useNavigate();

  // Preset subject selection or custom input
  const [selectedPreset, setSelectedPreset] = useState('OS');
  const [customSubject, setCustomSubject] = useState('');

  // Default exam time: tomorrow at 09:00 AM local
  const getDefaultExamTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm for datetime-local
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [examDateTime, setExamDateTime] = useState(getDefaultExamTime);
  const [hoursAvailable, setHoursAvailable] = useState(6);
  const [strategy, setStrategy] = useState('high_yield');

  // Fetch past sessions to display "Continue active session" card
  const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['examSessionsList'],
    queryFn: listExamSessions,
    retry: false,
  });

  // Extract sessions array safely
  const sessionsList = Array.isArray(sessionsData)
    ? sessionsData
    : sessionsData?.sessions || sessionsData?.data || [];

  const activeSession = sessionsList.find(
    (s) => s.status !== 'completed' && s.status !== 'finished'
  ) || sessionsList[0];

  // Mutation to create session
  const createMutation = useMutation({
    mutationFn: (payload) => createExamSession(payload),
    onSuccess: (data) => {
      showToast('Timed rescue plan created! Let’s lock in.', 'success');
      const sessionId = data.id || data.session_id;
      navigate(`/exam-rescue/session/${sessionId}`);
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || 'Failed to create exam rescue session.';
      showToast(detail, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const subject = (customSubject.trim() || selectedPreset || 'OS').toUpperCase();

    if (!examDateTime) {
      showToast('Please select your exam date and time.', 'error');
      return;
    }

    // Convert datetime-local value to ISO string with timezone offset
    const dateObj = new Date(examDateTime);
    if (isNaN(dateObj.getTime())) {
      showToast('Invalid exam date and time.', 'error');
      return;
    }

    const isoExamTime = dateObj.toISOString();

    createMutation.mutate({
      subject,
      exam_time: isoExamTime,
      hours_available: Number(hoursAvailable),
      strategy,
    });
  };

  return (
    <AppShell title="Exam Rescue Coach">
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Banner / Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
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
              background: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={18} color="#FFF" />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Crash Revision Mode
            </span>
          </div>

          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Exam tonight? Don’t panic.
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
            We’ll build a high-density, timed revision plan for the exact hours you still have. Zero fluff, high marks.
          </p>
        </div>

        {/* Continue Last Active Session Card */}
        {activeSession && (
          <Card padding="20px" accent glow glowColor="danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Flame size={14} color="#EF4444" fill="#EF4444" />
                  <span style={{ fontSize: 'var(--text-xs)', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Session Found
                  </span>
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Subject: {activeSession.subject}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {activeSession.topics?.length || 0} topics · Strategy: {activeSession.strategy === 'high_yield' ? 'High-Yield' : 'Full Pass'}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                rightIcon={ArrowRight}
                onClick={() => navigate(`/exam-rescue/session/${activeSession.id}`)}
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)', borderColor: '#EF4444' }}
              >
                Continue Session
              </Button>
            </div>
          </Card>
        )}

        {/* Setup Wizard Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* STEP A — Subject */}
          <Card padding="24px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Step A — Select Subject
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  What exam are you prepping for?
                </h3>
              </div>

              {/* Subject Presets Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SUBJECT_PRESETS.map((sub) => {
                  const isSelected = selectedPreset === sub && !customSubject;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(sub);
                        setCustomSubject('');
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all var(--t-fast)',
                        background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
                        color: isSelected ? '#EF4444' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? '#EF4444' : 'var(--border)'}`,
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              {/* Custom Subject Input */}
              <div>
                <Input
                  label="Or enter custom subject"
                  placeholder="e.g. Software Engineering, Compiler Design..."
                  value={customSubject}
                  onChange={(e) => {
                    setCustomSubject(e.target.value);
                    if (e.target.value) setSelectedPreset('');
                  }}
                />
              </div>
            </div>
          </Card>

          {/* STEP B — When + Time Budget */}
          <Card padding="24px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Step B — Schedule & Time Budget
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  When is the exam and how many hours do you have?
                </h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Exam Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={examDateTime}
                  onChange={(e) => setExamDateTime(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-sm)',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Hours Available Tonight
                  </label>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                    {hoursAvailable} hours
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={hoursAvailable}
                  onChange={(e) => setHoursAvailable(e.target.value)}
                  style={{ accentColor: '#EF4444' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  <span>1 hour (emergency)</span>
                  <span>6 hours (standard)</span>
                  <span>12 hours (overnight)</span>
                </div>
              </div>

              <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 'var(--text-xs)', color: '#F97316' }}>
                💡 <strong>Live hint:</strong> Plan will keep ~30 min for a final revision sheet right before the exam.
              </div>
            </div>
          </Card>

          {/* STEP C — Strategy Selection */}
          <Card padding="24px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Step C — Select Strategy
                </div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Choose your crash strategy
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {STRATEGIES.map((strat) => {
                  const isSelected = strategy === strat.id;
                  const Icon = strat.icon;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => setStrategy(strat.id)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-xl)',
                        background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface)',
                        border: `1px solid ${isSelected ? '#EF4444' : 'var(--border)'}`,
                        cursor: 'pointer',
                        transition: 'all var(--t-fast)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Icon size={20} color={strat.color} />
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: strat.color, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 'var(--radius-xs)', textTransform: 'uppercase' }}>
                          {strat.badge}
                        </span>
                      </div>
                      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {strat.title}
                      </h4>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                        {strat.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Generate Plan Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={createMutation.isPending}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: 'var(--text-md)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
              borderColor: '#EF4444',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            {createMutation.isPending ? 'Building your timed plan...' : 'Generate tonight’s plan →'}
          </Button>
        </form>
      </div>

      <style>{`
        @media (max-width: 640px) {
          form grid-template-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
