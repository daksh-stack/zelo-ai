import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * ExamCountdown component
 * @param {Object} props
 * @param {string} props.examTime - ISO datetime string with timezone
 * @param {number} [props.hoursAvailable] - Hours allocated for session
 */
export const ExamCountdown = ({ examTime, hoursAvailable }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: false });

  useEffect(() => {
    if (!examTime) return;

    const calculateTime = () => {
      const target = new Date(examTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [examTime]);

  const formattedExamTime = examTime
    ? new Date(examTime).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Flame top line edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="#EF4444" />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Countdown to Exam
          </span>
        </div>
        {hoursAvailable && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {hoursAvailable}h budget
          </span>
        )}
      </div>

      {timeLeft.isPassed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', color: '#F97316' }}>
          <AlertTriangle size={18} color="#F97316" />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
            Exam started — finish revision.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', margin: '4px 0 8px' }}>
          {timeLeft.days > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F3F5', fontFamily: 'var(--font-mono)' }}>
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>d</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F3F5', fontFamily: 'var(--font-mono)' }}>
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>h</span>
          </div>
          <span style={{ fontSize: '1.2rem', color: '#EF4444', fontWeight: 700 }}>:</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F1F3F5', fontFamily: 'var(--font-mono)' }}>
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>m</span>
          </div>
          <span style={{ fontSize: '1.2rem', color: '#EF4444', fontWeight: 700 }}>:</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>s</span>
          </div>
        </div>
      )}

      {formattedExamTime && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Target: <span style={{ color: 'var(--text-secondary)' }}>{formattedExamTime}</span>
        </div>
      )}
    </div>
  );
};
