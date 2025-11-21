import type {
  Staff,
  CreateStaffPayload,
  UpdateStaffPayload,
  ListStaffResponse,
  StaffResponse
} from '../types/staff';
import apiClient from '../lib/apiClient';

const BASE_URL = '/api/staff/dealer';

/**
 * List all staff members for the current dealer
 */
export const listStaff = async (): Promise<Staff[]> => {
  const response = await apiClient.get<ListStaffResponse>(BASE_URL);
  return response.data.data || [];
};

/**
 * Get a single staff member by ID
 */
export const getStaff = async (userId: number): Promise<Staff> => {
  const response = await apiClient.get<StaffResponse>(`${BASE_URL}/${userId}`);
  return response.data.data;
};

/**
 * Create a new staff member
 */
export const createStaff = async (payload: CreateStaffPayload): Promise<Staff> => {
  const response = await apiClient.post<StaffResponse>(BASE_URL, payload);
  return response.data.data;
};

/**
 * Update an existing staff member
 */
export const updateStaff = async (
  userId: number,
  payload: UpdateStaffPayload
): Promise<Staff> => {
  const response = await apiClient.put<StaffResponse>(`${BASE_URL}/${userId}`, payload);
  return response.data.data;
};

/**
 * Delete a staff member permanently
 */
export const deleteStaff = async (userId: number): Promise<void> => {
  await apiClient.delete(`${BASE_URL}/${userId}`);
};
