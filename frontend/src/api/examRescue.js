import { apiClient } from './client';

/**
 * Create a new exam rescue session
 * @param {Object} payload - { subject, exam_time, hours_available, strategy }
 */
export const createExamSession = async (payload) => {
  const response = await apiClient.post('/exam-rescue/sessions', payload);
  return response.data;
};

/**
 * List all exam rescue sessions for current user (newest first)
 */
export const listExamSessions = async () => {
  const response = await apiClient.get('/exam-rescue/sessions');
  return response.data;
};

/**
 * Get full session details + topics by ID
 * @param {string} id - session UUID
 */
export const getExamSession = async (id) => {
  const response = await apiClient.get(`/exam-rescue/sessions/${id}`);
  return response.data;
};

/**
 * Update topic status
 * @param {string} topicId - topic UUID
 * @param {string} status - 'pending' | 'in_progress' | 'covered' | 'skipped'
 */
export const updateTopicStatus = async (topicId, status) => {
  const response = await apiClient.patch(`/exam-rescue/topics/${topicId}/status`, { status });
  return response.data;
};

/**
 * Get revision sheet for a session
 * @param {string} id - session UUID
 */
export const getRevisionSheet = async (id) => {
  const response = await apiClient.get(`/exam-rescue/sessions/${id}/revision-sheet`);
  return response.data;
};

/**
 * Mark exam session completed
 * @param {string} id - session UUID
 */
export const completeExamSession = async (id) => {
  const response = await apiClient.post(`/exam-rescue/sessions/${id}/complete`);
  return response.data;
};
