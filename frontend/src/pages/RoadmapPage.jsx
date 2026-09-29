import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Target,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { getCurrentRoadmapApi, generateRoadmapApi } from '../api/roadmaps';
import { getWeeklyReport, advanceRoadmapPhase, getRoadmapTemplates } from '../api/insights';

export const RoadmapPage = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('SDE');
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  // 1. Fetch current roadmap
  const {
    data: roadmap,
    isLoading: isRoadmapLoading,
    isError,
    refetch: refetchRoadmap,
  } = useQuery({
    queryKey: ['currentRoadmap'],
    queryFn: getCurrentRoadmapApi,
    retry: false,
  });

  // 2. Fetch weekly insights report to know if user can advance phase
  const { data: weeklyReport } = useQuery({
    queryKey: ['insights', 'weekly'],
    queryFn: getWeeklyReport,
    retry: false,
  });

  // 3. Fetch roadmap templates
  const { data: templatesData } = useQuery({
    queryKey: ['roadmapTemplates'],
    queryFn: getRoadmapTemplates,
    retry: false,
  });

  const templatesList = templatesData?.templates || [
    { id: 'sde', label: 'SDE / Backend' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'data', label: 'Data / ML' },
    { id: 'devops', label: 'DevOps / Cloud' },
    { id: 'core', label: 'Core ECE/EEE' },
  ];

  // Generate roadmap mutation
  const generateMutation = useMutation({
    mutationFn: (targetRole) => generateRoadmapApi({ target_role: targetRole || selectedRole }),
    onSuccess: () => {
      showToast('New campaign roadmap generated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['currentRoadmap'] });
      queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'weekly'] });
      refetchRoadmap();
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to generate roadmap.', 'error');
    },
  });

  // Advance Phase mutation
  const advanceMutation = useMutation({
    mutationFn: advanceRoadmapPhase,
    onMutate: () => setIsAdvancing(true),
    onSuccess: (data) => {
      if (data?.advanced === false) {
        showToast(data.message || 'Unable to advance phase.', 'info');
      } else {
        const phaseTitle = data?.phase_title || `Phase ${data?.current_phase + 1}`;
        showToast(`Phase advanced! Now on ${phaseTitle}`, 'success');
        queryClient.invalidateQueries({ queryKey: ['currentRoadmap'] });
        queryClient.invalidateQueries({ queryKey: ['insights', 'weekly'] });
        queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
        queryClient.invalidateQueries({ queryKey: ['progressSummary'] });
      }
      setShowAdvanceConfirm(false);
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to advance phase.';
      showToast(detail, 'error');
    },
    onSettled: () => setIsAdvancing(false),
  });

  const phases = roadmap?.phases || [];
  const currentPhaseIdx = roadmap?.current_phase || 0;
  const totalPhases = phases.length;
  const progressPercent =
    totalPhases > 0 ? Math.round(((currentPhaseIdx + 1) / totalPhases) * 100) : 0;

  const canAdvance = weeklyReport?.can_advance_phase === true;

  return (
    <AppShell title="Campaign Roadmap">
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Roadmap Overview Header */}
        <Card padding="24px" glow glowColor="accent" accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Shield size={18} color="var(--accent)" />
                <Badge variant="cyan">CAMPAIGN PATH</Badge>
                {roadmap && <Badge variant="muted">Phase {currentPhaseIdx + 1}</Badge>}
              </div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                {roadmap?.title || 'Personalized Tech Roadmap'}
              </h1>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Targeting Role: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{(roadmap?.target_role || selectedRole)?.toUpperCase()}</span>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-elevated)', padding: '12px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--success)' }}>
                    Phase {currentPhaseIdx + 1} of {totalPhases || 4}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Campaign Progress</div>
                </div>
                <div style={{ width: '90px' }}>
                  <ProgressBar progress={progressPercent} variant="cyan" height="6px" />
                </div>
              </div>

              {/* Advance Phase Button Header CTA */}
              {roadmap && (
                <Button
                  variant="primary"
                  size="md"
                  disabled={!canAdvance || isAdvancing}
                  onClick={() => setShowAdvanceConfirm(true)}
                  style={{
                    opacity: canAdvance ? 1 : 0.6,
                    cursor: canAdvance ? 'pointer' : 'not-allowed',
                  }}
                  title={canAdvance ? 'Advance to next phase' : 'Complete 5 days of tasks to unlock advance'}
                >
                  Advance Phase
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Loading Skeletons */}
        {isRoadmapLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
            <Skeleton height="140px" borderRadius="16px" />
          </div>
        ) : isError || !roadmap ? (
          /* Empty / Generate Roadmap CTA with Template Selector */
          <Card padding="40px" accent>
            <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
              <MapPin size={44} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
                Build Your Target Tech Campaign
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '8px 0 20px' }}>
                Select your engineering domain template to build a structured, step-by-step career roadmap.
              </p>

              {/* Template Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                {templatesList.map((tpl) => {
                  const isSelected = selectedRole.toLowerCase() === tpl.label.toLowerCase() || selectedRole === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedRole(tpl.label)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        background: isSelected ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isSelected ? '#0C0E11' : 'var(--text-secondary)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        transition: 'all var(--t-fast)',
                      }}
                    >
                      {tpl.label}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                isLoading={generateMutation.isPending}
                onClick={() => generateMutation.mutate(selectedRole)}
              >
                Generate {selectedRole} Roadmap
              </Button>
            </div>
          </Card>
        ) : (
          /* Vertical Phase Timeline */
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Timeline Vertical Connecting Line */}
            <div
              style={{
                position: 'absolute',
                top: '32px',
                bottom: '32px',
                left: '23px',
                width: '2px',
                background: 'linear-gradient(180deg, var(--accent) 0%, var(--border) 100%)',
                zIndex: 0,
              }}
            />

            {phases.map((phase, index) => {
              const isCurrent = index === currentPhaseIdx;
              const isCompleted = index < currentPhaseIdx;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Timeline Circle Marker */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isCurrent
                        ? 'var(--accent)'
                        : isCompleted
                        ? 'var(--success)'
                        : 'var(--bg-elevated)',
                      border: isCurrent
                        ? '3px solid var(--accent-border)'
                        : isCompleted
                        ? '3px solid var(--success-border)'
                        : '2px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCurrent || isCompleted ? '#0C0E11' : 'var(--text-tertiary)',
                      fontWeight: 800,
                      fontSize: 'var(--text-base)',
                      boxShadow: isCurrent ? '0 0 20px var(--accent-glow)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={24} color="#0C0E11" /> : index + 1}
                  </div>

                  {/* Phase Card */}
                  <div style={{ flex: 1 }}>
                    <Card
                      padding="24px"
                      glow={isCurrent}
                      glowColor="accent"
                      accent={isCurrent}
                      style={{
                        opacity: isCompleted ? 0.8 : 1,
                        borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isCurrent ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                              Phase {phase.phase || index + 1}
                            </span>
                            {isCurrent && (
                              <Badge variant="cyan" icon={Sparkles}>
                                Active Phase
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="success" icon={CheckCircle2}>
                                Completed
                              </Badge>
                            )}
                          </div>

                          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {phase.title}
                          </h3>
                        </div>

                        {/* Duration Pill */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-full)',
                            padding: '4px 12px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={13} color="var(--text-tertiary)" />
                          <span>{phase.duration_weeks} Weeks</span>
                        </div>
                      </div>

                      {/* Focus Tags */}
                      {phase.focus && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                            Core Focus Areas
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {phase.focus.map((tag, tIdx) => (
                              <Badge key={tIdx} variant={isCurrent ? 'cyan' : 'muted'}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Goals List */}
                      {phase.goals && (
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                            Milestones & Goals
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {phase.goals.map((goal, gIdx) => (
                              <div
                                key={gIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: 'var(--text-xs)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 size={15} color="var(--success)" />
                                ) : isCurrent ? (
                                  <Target size={15} color="var(--accent)" />
                                ) : (
                                  <Circle size={15} color="var(--text-tertiary)" />
                                )}
                                <span>{goal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer CTA for Active Phase */}
                      {isCurrent && (
                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            {canAdvance
                              ? '🎉 Requirements met! Ready to advance campaign.'
                              : 'Keep executing daily missions to qualify for phase advancement.'}
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!canAdvance || isAdvancing}
                            onClick={() => setShowAdvanceConfirm(true)}
                          >
                            Advance Phase
                          </Button>
                        </div>
                      )}
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal for Advance Phase */}
        <Modal
          isOpen={showAdvanceConfirm}
          onClose={() => setShowAdvanceConfirm(false)}
          title="Confirm Phase Advancement"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Move to the next phase? Tomorrow’s daily tasks will follow your new curriculum focus area.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowAdvanceConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isAdvancing}
                onClick={() => advanceMutation.mutate()}
              >
                Confirm & Advance
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};
