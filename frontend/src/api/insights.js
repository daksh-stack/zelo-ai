import { apiClient } from './client';

/**
 * Fetch 7-day weekly insights report
 */
export const getWeeklyReport = async () => {
  const response = await apiClient.get('/insights/weekly');
  return response.data;
};

/**
 * Generate a 1-question post-task micro-quiz for a completed daily task
 * @param {string} taskId - task UUID
 */
export const createTaskQuiz = async (taskId) => {
  const response = await apiClient.post(`/insights/tasks/${taskId}/quiz`);
  return response.data;
};

/**
 * Submit selected option index for a micro-quiz
 * @param {string} quizId - quiz attempt UUID
 * @param {number} selectedIndex - index of chosen option (0-indexed)
 */
export const answerQuiz = async (quizId, selectedIndex) => {
  const response = await apiClient.post(`/insights/quiz/${quizId}/answer`, {
    selected_index: selectedIndex,
  });
  return response.data;
};

/**
 * Advance current roadmap to the next phase
 */
export const advanceRoadmapPhase = async () => {
  const response = await apiClient.post('/insights/roadmaps/advance-phase');
  return response.data;
};

/**
 * Get available roadmap templates for roadmap creation
 */
export const getRoadmapTemplates = async () => {
  const response = await apiClient.get('/roadmaps/templates');
  return response.data;
};
