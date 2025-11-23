import api from '../lib/apiClient';
import type { Notification } from '../types/notification';

const API_BASE_URL = '/api/notifications';

/**
 * Fetch all notifications for current user
 * GET /api/notifications/all
 * Works for all roles (admin, dealer manager, dealer staff)
 */
export const fetchAllNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/all`);
  return response.data;
};

/**
 * Fetch notifications for admin only
 * GET /api/notifications/admin
 */
export const fetchAdminNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/admin`);
  return response.data;
};

/**
 * Fetch notifications for dealer manager
 * GET /api/notifications/dealer/manager/{dealerId}
 */
export const fetchDealerManagerNotifications = async (dealerId: number): Promise<Notification[]> => {
  const response = await api.get<Notification[]>(`${API_BASE_URL}/dealer/manager/${dealerId}`);
  return response.data;
};

/**
 * Fetch notifications for dealer staff
 * GET /api/notifications/dealer/staff/{staffId}
 * @param staffId - The staff's profileId (not dealerId!)
 */
export const fetchDealerStaffNotifications = async (staffId: number): Promise<Notification[]> => {
  try {
    const response = await api.get<Notification[]>(`${API_BASE_URL}/dealer/staff/${staffId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching staff notifications:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    throw error;
  }
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
