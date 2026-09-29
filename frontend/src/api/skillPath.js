import { apiClient } from './client';

/**
 * Get Quick Revision flashcards
 * @param {string} [topics] - optional comma-separated topics e.g. "dsa,os"
 */
export const getQuickRevision = async (topics) => {
  const params = {};
  if (topics && topics.trim()) {
    params.topics = topics.trim();
  }
  const response = await apiClient.get('/skill-path/quick-revision', { params });
  return response.data;
};

/**
 * Start a new interview practice session
 * @param {Object} payload - { domain: string, total_questions?: number }
 */
export const startInterview = async (payload) => {
  const response = await apiClient.post('/skill-path/interview-practice/sessions', payload);
  return response.data;
};

/**
 * Resume or get existing interview session details
 * @param {string} id - session UUID
 */
export const getInterviewSession = async (id) => {
  const response = await apiClient.get(`/skill-path/interview-practice/sessions/${id}`);
  return response.data;
};

/**
 * Submit an answer for an interview question
 * @param {Object} payload - { answer_id: string, user_answer: string }
 */
export const submitInterviewAnswer = async (payload) => {
  const response = await apiClient.post('/skill-path/interview-practice/answer', payload);
  return response.data;
};

/**
 * Request Socratic probes to test understanding of a topic
 * @param {Object} payload - { topic_title: string, notes_summary?: string }
 */
export const startUnderstandingProbe = async (payload) => {
  const response = await apiClient.post('/skill-path/test-understanding', payload);
  return response.data;
};

/**
 * Evaluate user's answer to a Socratic probe
 * @param {Object} payload - { question: string, user_answer: string }
 */
export const evaluateUnderstanding = async (payload) => {
  const response = await apiClient.post('/skill-path/test-understanding/evaluate', payload);
  return response.data;
};
