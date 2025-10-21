/**
 * Tests de connectivité ultra-rapides
 */

import { Platform } from 'react-native';

export const quickConnectionTest = async (): Promise<boolean> => {
  try {
    const testUrl = Platform.OS === 'android' ? 'http://10.8.252.74:3000/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${testUrl}/health`, {
      method: 'GET',
      // Timeout ultra-court
      signal: AbortSignal.timeout(1000)
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const quickLoginTest = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const testUrl = Platform.OS === 'android' ? 'http://10.8.252.74:3000/api' : 'http://localhost:3000/api';
    
    const response = await fetch(`${testUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      // Timeout court
      signal: AbortSignal.timeout(2000)
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      message: data.message
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
};

export const testAllUrlsQuickly = async (): Promise<{ url: string; success: boolean }[]> => {
  const testUrls = [
    'http://10.8.252.74:3000/api',
    'http://10.0.2.2:3000/api',
    'http://localhost:3000/api'
  ];
  
  const promises = testUrls.map(async (url) => {
    try {
      const response = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(1000)
      });
      return { url, success: response.ok };
    } catch {
      return { url, success: false };
    }
  });
  
  return Promise.all(promises);
};
