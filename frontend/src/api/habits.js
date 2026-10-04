import { apiClient } from './client';

/**
 * Spend a streak freeze to protect a missed day
 */
export const useStreakFreeze = async () => {
  const response = await apiClient.post('/habits/streak/freeze');
  return response.data;
};

/**
 * Get daily and weekly challenges with current progress
 */
export const getChallenges = async () => {
  const response = await apiClient.get('/habits/challenges');
  return response.data;
};

/**
 * Get earned and locked warrior badges
 */
export const getBadges = async () => {
  const response = await apiClient.get('/habits/badges');
  return response.data;
};

/**
 * Start a new focus session (15-90 minutes)
 * @param {number} plannedMinutes - 15, 25, 45, or 60
 */
export const startFocus = async (plannedMinutes) => {
  const response = await apiClient.post('/habits/focus/start', {
    planned_minutes: plannedMinutes,
  });
  return response.data;
};

/**
 * Get active running focus session if any
 */
export const getActiveFocus = async () => {
  const response = await apiClient.get('/habits/focus/active');
  return response.data;
};

/**
 * Finish or abort an active focus session
 * @param {string} sessionId - UUID of focus session
 * @param {boolean} aborted - true if aborting without XP reward
 */
export const finishFocus = async (sessionId, aborted = false) => {
  const response = await apiClient.post(`/habits/focus/${sessionId}/finish`, {
    aborted,
  });
  return response.data;
};
