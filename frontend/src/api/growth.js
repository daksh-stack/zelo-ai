import { apiClient } from './client';

export const getAppConfig = async () => {
  const { data } = await apiClient.get('/growth/config');
  return data;
};

export const getGrowthPrefs = async () => {
  const { data } = await apiClient.get('/growth/prefs');
  return data;
};

export const patchGrowthPrefs = async (body) => {
  const { data } = await apiClient.patch('/growth/prefs', body);
  return data;
};

export const getNotifications = async ({ unreadOnly = false, limit = 30 } = {}) => {
  const { data } = await apiClient.get('/growth/notifications', {
    params: { unread_only: unreadOnly, limit },
  });
  return Array.isArray(data) ? data : [];
};

export const markNotificationsRead = async (notificationId = null) => {
  const params = notificationId ? { notification_id: notificationId } : {};
  const { data } = await apiClient.post('/growth/notifications/read', {}, { params });
  return data;
};

export const sendFeedback = async ({ category, message, page }) => {
  const { data } = await apiClient.post('/growth/feedback', { category, message, page });
  return data;
};

export const postGrowthEvent = async ({ name, props = {} }) => {
  await apiClient.post('/growth/events', { name, props });
};
