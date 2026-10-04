import { apiClient } from './client';

/**
 * Get current user social identity (display_name, college, board_opt_in)
 */
export const getSocialMe = async () => {
  const response = await apiClient.get('/social/me');
  return response.data;
};

/**
 * Patch user social identity
 * @param {Object} body - { display_name?, college?, board_opt_in? }
 */
export const patchSocialMe = async (body) => {
  const response = await apiClient.patch('/social/me', body);
  return response.data;
};

/**
 * Send a friend request by email
 * @param {string} email
 */
export const requestFriend = async (email) => {
  const response = await apiClient.post('/social/friends/request', { email });
  return response.data;
};

/**
 * Get list of pending incoming friend requests
 */
export const getPendingFriends = async () => {
  const response = await apiClient.get('/social/friends/pending');
  return response.data;
};

/**
 * Respond to a pending friend request
 * @param {string} friendshipId
 * @param {boolean} accept
 */
export const respondFriend = async (friendshipId, accept) => {
  const response = await apiClient.post(`/social/friends/${friendshipId}/respond`, { accept });
  return response.data;
};

/**
 * Get accepted friends list with stats
 */
export const getFriends = async () => {
  const response = await apiClient.get('/social/friends');
  return response.data;
};

/**
 * Create a new circle
 * @param {string} name
 */
export const createCircle = async (name) => {
  const response = await apiClient.post('/social/circles', { name });
  return response.data;
};

/**
 * Join an existing circle by invite code
 * @param {string} code
 */
export const joinCircle = async (code) => {
  const response = await apiClient.post('/social/circles/join', { invite_code: code });
  return response.data;
};

/**
 * Get user's active circles
 */
export const getCircles = async () => {
  const response = await apiClient.get('/social/circles');
  return response.data;
};

/**
 * Get leaderboard data by scope ('friends' | 'college' | 'circle')
 * @param {string} scope
 * @param {string} [circleId]
 */
export const getLeaderboard = async (scope, circleId = null) => {
  let url = `/social/leaderboard?scope=${scope}`;
  if (scope === 'circle' && circleId) {
    url += `&circle_id=${circleId}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};
