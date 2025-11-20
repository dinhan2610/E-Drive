import api from '../lib/apiClient';
import type { Notification } from '../types/notification';

const API_BASE_URL = '/api/notifications';

/**
 * Fetch all notifications for admin
 * GET /api/notifications/admin
 */
export const fetchAdminNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/admin`);
  return response.data;
};

/**
 * Fetch all notifications for current user (Dealer/Manager)
 * GET /api/notifications/all
 */
export const fetchAllNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/all`);
  return response.data;
};

/**
 * Fetch notifications for a specific dealer
 * GET /api/notifications/dealer/{dealerId}
 */
export const fetchDealerNotifications = async (dealerId: number): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/dealer/${dealerId}`);
  return response.data;
};

/**
 * Mark a notification as read
 * PUT /api/notifications/{id}/read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.put(`${API_BASE_URL}/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put(`${API_BASE_URL}/read-all`);
};
