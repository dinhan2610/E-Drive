import api from '../lib/apiClient';
import { getProfile } from './profileApi';

// ===== TYPES =====

export interface ChatApiResponse {
  statusCode: number;
  message: string;
  data: string;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

// ===== API FUNCTIONS =====

/**
 * Send a message to the chat support API
 * @param message - The user's message
 * @returns The AI response text
 */
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    if (!message?.trim()) {
      throw new ChatApiError('Message cannot be empty', 'EMPTY_MESSAGE');
    }

    // Get dealer ID from user profile
    const profile = await getProfile();
    const dealerId = profile.dealerId;

    if (!dealerId) {
      throw new ChatApiError(
        'Dealer ID not found. Please make sure you are logged in.',
        'NO_DEALER_ID'
      );
    }

    // Call chat support API with dealerId
    const response = await api.post<ChatApiResponse>(
      '/api/chat-support',
      null,
      {
        params: {
          message: message.trim(),
          dealerId: dealerId,
        },
        headers: { 'accept': '*/*' },
      }
    );

    // Extract the actual message from response.data.data
    return response.data?.data || response.data?.message || '';
  } catch (error: any) {
    console.error('❌ Error sending chat message:', error);

    // Handle ChatApiError
    if (error instanceof ChatApiError) {
      throw error;
    }

    // Handle Axios errors
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          throw new ChatApiError(
            'Invalid message format or missing dealer ID',
            'INVALID_REQUEST',
            status
          );
        case 401:
          throw new ChatApiError(
            'Authentication required. Please login to use chat',
            'UNAUTHORIZED',
            status
          );
        case 403:
          throw new ChatApiError(
            'You do not have permission to use chat service',
            'FORBIDDEN',
            status
          );
        case 404:
          throw new ChatApiError(
            'Chat service not found',
            'NOT_FOUND',
            status
          );
        case 429:
          throw new ChatApiError(
            'Too many requests. Please try again later',
            'RATE_LIMIT',
            status
          );
        case 503:
          throw new ChatApiError(
            'Chat service is temporarily unavailable',
            'SERVICE_UNAVAILABLE',
            status
          );
        default:
          throw new ChatApiError(
            error.response.data?.message || 'Failed to send message',
            'API_ERROR',
            status
          );
      }
    }

    if (error.request) {
      throw new ChatApiError(
        'Cannot connect to chat service',
        'NETWORK_ERROR'
      );
    }

    throw new ChatApiError(
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR'
    );
  }
};

/**
 * Check chat service health
 * @returns true if service is healthy, false otherwise
 */
export const checkChatHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/chat-support/health', {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Chat service health check failed:', error);
    return false;
  }
};
