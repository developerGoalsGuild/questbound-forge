/**
 * Authentication utilities for API calls.
 */

// Mock implementation for now - in a real app this would integrate with your auth system
export const getAuthHeaders = () => {
  // In a real implementation, this would get the token from your auth store
  const token = localStorage.getItem('auth_token') || 'mock-token';
  
  return {
    'Authorization': `Bearer ${token}`,
    'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || 'mock-api-key'
  };
};

export const getCurrentUser = () => {
  // Mock user for now
  return {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com'
  };
};

