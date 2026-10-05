import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, ArrowRight, ShieldCheck, Trophy, KeyRound } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getSocialMe, getCircles } from '../api/social';
import { FriendList } from '../components/social/FriendList';
import { PendingRequests } from '../components/social/PendingRequests';
import { CirclePanel } from '../components/social/CirclePanel';
import { LeaderboardTable } from '../components/social/LeaderboardTable';
import { trackEvent } from '../lib/trackEvent';

export const SquadPage = () => {
  const navigate = useNavigate();
  const [selectedCircleId, setSelectedCircleId] = useState(null);

  useEffect(() => {
    trackEvent('squad_open', {});
  }, []);

  const { data: socialMe } = useQuery({
    queryKey: ['socialMe'],
    queryFn: getSocialMe,
  });

  const { data: circlesList = [] } = useQuery({
    queryKey: ['social', 'circles'],
    queryFn: getCircles,
  });

  const isCallsignSet = Boolean(socialMe?.display_name);

  return (
    <AppShell title="Squad & Accountability">
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Callsign Alert Banner if display_name is empty */}
        {!isCallsignSet && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={20} color="#F59E0B" flexShrink={0} />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Set your warrior callsign
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Set a callsign before you appear on college and circle leaderboards.
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              rightIcon={ArrowRight}
              onClick={() => navigate('/profile')}
            >
              Set Callsign on Profile
            </Button>
          </div>
        )}

        {/* Pending Requests Banner / List */}
        <PendingRequests />

        {/* Friends and Circles Grid (2 columns on desktop) */}
        <div className="squad-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FriendList />
          <CirclePanel
            selectedCircleId={selectedCircleId}
            onSelectCircle={(id) => setSelectedCircleId(id)}
          />
        </div>

        {/* Main Leaderboard Table */}
        <LeaderboardTable circleId={selectedCircleId} circlesList={circlesList} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .squad-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AppShell>
  );
};
