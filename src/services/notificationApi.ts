import api from '../lib/apiClient';
import type { Notification } from '../types/notification';

const API_BASE_URL = '/notifications';

/**
 * Fetch all notifications for admin
 * GET /api/notifications/admin
 */
export const fetchAdminNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/admin`);
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
