const BASE_URL = 'http://localhost:8080';

/**
 * Send a message to the chat API
 * @param message - The user's message
 * @returns The AI response
 */
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${BASE_URL}/chat?message=${encodeURIComponent(message)}`, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // API trả về text response
    const aiResponse = await response.text();
    return aiResponse;
  } catch (error) {
    console.error('❌ Error sending chat message:', error);
    throw error;
  }
};

/**
 * Check chat service health
 */
export const checkChatHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/chat/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Chat service health check failed:', error);
    return false;
  }
};
