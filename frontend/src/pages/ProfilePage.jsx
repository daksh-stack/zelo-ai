import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Save,
  LogOut,
  Flame,
  Zap,
  ShieldCheck,
  Video,
  BookOpen,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Spinner';
import { showToast } from '../components/ui/Toast';
import { getProfileApi, updateProfileApi } from '../api/profile';
import { getProgressSummaryApi } from '../api/progress';
import { getMeApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { FreezeButton } from '../components/habits/FreezeButton';
import { BadgeShelf } from '../components/habits/BadgeShelf';
import { SocialIdentityForm } from '../components/social/SocialIdentityForm';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: getMeApi });
  const { data: summary } = useQuery({ queryKey: ['progressSummary'], queryFn: getProgressSummaryApi });
  const { data: profile, isLoading } = useQuery({ queryKey: ['userProfile'], queryFn: getProfileApi });

  // Form State
  const [year, setYear] = useState(3);
  const [branch, setBranch] = useState('CSE');
  const [targetRoles, setTargetRoles] = useState(['SDE']);
  const [dailyHours, setDailyHours] = useState(3);
  const [preferredStyle, setPreferredStyle] = useState('video');
  const [skillLevels, setSkillLevels] = useState({ dsa: 2, system_design: 1, python: 3 });
  const [weakAreas, setWeakAreas] = useState(['system design', 'os']);

  useEffect(() => {
    if (profile) {
      if (profile.year) setYear(profile.year);
      if (profile.branch) setBranch(profile.branch);
      if (profile.target_roles) setTargetRoles(profile.target_roles);
      if (profile.daily_hours) setDailyHours(profile.daily_hours);
      if (profile.preferred_style) setPreferredStyle(profile.preferred_style);
      if (profile.skill_levels) setSkillLevels(profile.skill_levels);
      if (profile.weak_areas) setWeakAreas(profile.weak_areas);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateProfileApi(data),
    onSuccess: () => {
      showToast('Warrior parameters updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (err) => {
      showToast(err?.response?.data?.detail || 'Failed to update profile.', 'error');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      year: Number(year),
      branch,
      target_roles: targetRoles,
      daily_hours: Number(dailyHours),
      preferred_style: preferredStyle,
      skill_levels: skillLevels,
      weak_areas: weakAreas,
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rolesOptions = ['SDE', 'Backend', 'Frontend', 'Full-stack', 'Data', 'DevOps'];
  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
  const weakAreaOptions = ['system design', 'os', 'dbms', 'networks', 'dsa', 'web dev', 'oops', 'python'];

  const toggleTargetRole = (role) => {
    if (targetRoles.includes(role)) {
      if (targetRoles.length > 1) setTargetRoles(targetRoles.filter((r) => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  const toggleWeakArea = (area) => {
    if (weakAreas.includes(area)) {
      setWeakAreas(weakAreas.filter((a) => a !== area));
    } else {
      setWeakAreas([...weakAreas, area]);
    }
  };

  const streakCount = summary?.streak?.current_streak || 0;
  const totalXp = summary?.xp?.total_xp || 0;
  const level = Math.floor(totalXp / 100) + 1;
  const freezes = summary?.streak?.freezes_remaining ?? 1;

  return (
    <AppShell title="Profile & Settings">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Profile Header Card */}
        <Card padding="24px" glow glowColor="accent" accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px var(--accent-glow)',
                }}
              >
                <Shield size={24} color="#0C0E11" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                  {user?.email || 'Engineering Student'}
                </h1>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Student Member · Zilo-AI Terminal
                </p>
              </div>
            </div>

            <Button variant="danger" size="sm" leftIcon={LogOut} onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="var(--streak)" fill="var(--streak)" />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--streak)' }}>{streakCount} Days</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Flame Streak</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--xp)" />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--xp)' }}>Rank {level}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{totalXp} Total XP</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--accent)' }}>{freezes} Shield</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Freeze Available</div>
                </div>
              </div>

              <FreezeButton freezesRemaining={freezes} currentStreak={streakCount} size="xs" variant="ghost" />
            </div>
          </div>
        </Card>

        {/* Phase 5: Social Identity & Board Settings */}
        <SocialIdentityForm />

        {/* Phase 4: Warrior Badge Shelf on Profile */}
        <BadgeShelf compact={false} />

        {/* Settings Form */}
        {isLoading ? (
          <Skeleton height="320px" borderRadius="16px" />
        ) : (
          <form onSubmit={handleSave}>
            <Card padding="28px" accent style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Campaign Parameters
              </h3>

              {/* Roles */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Target Roles
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {rolesOptions.map((r) => {
                    const isSel = targetRoles.includes(r);
                    return (
                      <Badge
                        key={r}
                        variant={isSel ? 'cyan' : 'muted'}
                        onClick={() => toggleTargetRole(r)}
                        active={isSel}
                      >
                        {r}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Year & Branch */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y} style={{ background: '#111418' }}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Engineering Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b} value={b} style={{ background: '#111418' }}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Daily Hours & Style */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Daily Execution Time ({dailyHours} hours)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Resource Format Preference
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Badge
                      variant={preferredStyle === 'video' ? 'cyan' : 'muted'}
                      onClick={() => setPreferredStyle('video')}
                      icon={Video}
                      active={preferredStyle === 'video'}
                    >
                      Video
                    </Badge>
                    <Badge
                      variant={preferredStyle === 'text' ? 'cyan' : 'muted'}
                      onClick={() => setPreferredStyle('text')}
                      icon={BookOpen}
                      active={preferredStyle === 'text'}
                    >
                      Text
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Weak areas */}
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Target Weak Areas & Refinements
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {weakAreaOptions.map((area) => {
                    const isSel = weakAreas.includes(area);
                    return (
                      <Badge
                        key={area}
                        variant={isSel ? 'accent' : 'muted'}
                        onClick={() => toggleWeakArea(area)}
                        active={isSel}
                      >
                        {area.toUpperCase()}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={Save}
                  isLoading={updateMutation.isPending}
                >
                  Save Campaign Settings
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </AppShell>
  );
};
