import apiClient from '../lib/apiClient';
import type { Feedback, FeedbackListResponse, FeedbackFilters } from '../types/feedback';

/**
 * List feedbacks with filters and pagination
 */
export async function listFeedbacks(filters: FeedbackFilters = {}): Promise<FeedbackListResponse> {
  const params: any = {};
  
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.size !== undefined) params.size = filters.size;
  if (filters.rating !== undefined) params.rating = filters.rating;
  if (filters.dealerId !== undefined) params.dealerId = filters.dealerId;
  if (filters.customerId !== undefined) params.customerId = filters.customerId;
  if (filters.status) params.status = filters.status;

  const response = await apiClient.get<FeedbackListResponse>('/api/feedbacks', { params });
  return response.data;
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(id: number): Promise<Feedback> {
  const response = await apiClient.get<Feedback>(`/api/feedbacks/${id}`);
  return response.data;
}

/**
 * Create new feedback
 */
export async function createFeedback(data: Omit<Feedback, 'feedbackId' | 'createdAt'>): Promise<Feedback> {
  const response = await apiClient.post<Feedback>('/api/feedbacks', data);
  return response.data;
}

/**
 * Update feedback
 */
export async function updateFeedback(id: number, data: Partial<Feedback>): Promise<Feedback> {
  const response = await apiClient.put<Feedback>(`/api/feedbacks/${id}`, data);
  return response.data;
}

/**
 * Delete feedback
 */
export async function deleteFeedback(id: number): Promise<void> {
  await apiClient.delete(`/api/feedbacks/${id}`);
}

/**
 * Respond to feedback
 */
export async function respondToFeedback(id: number, responseText: string): Promise<Feedback> {
  const response = await apiClient.post<Feedback>(`/api/feedbacks/${id}/respond`, { response: responseText });
  return response.data;
}

/**
 * Get feedbacks by dealer ID
 */
export async function getFeedbacksByDealer(dealerId: number, page = 0, size = 10): Promise<FeedbackListResponse> {
  return listFeedbacks({ dealerId, page, size });
}

/**
 * Get feedbacks by customer ID
 */
export async function getFeedbacksByCustomer(customerId: number, page = 0, size = 10): Promise<FeedbackListResponse> {
  return listFeedbacks({ customerId, page, size });
}

/**
 * Get feedbacks by rating
 */
export async function getFeedbacksByRating(rating: number, page = 0, size = 10): Promise<FeedbackListResponse> {
  return listFeedbacks({ rating, page, size });
}
