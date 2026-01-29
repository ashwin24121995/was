/**
 * WASender API Client
 * Handles all interactions with the WASender WhatsApp API
 * API Documentation: https://wasenderapi.com/api-docs
 */

import axios, { AxiosInstance } from 'axios';

export interface WASenderConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SendTextMessageParams {
  to: string; // Phone number with country code (e.g., "919876543210")
  message: string;
}

export interface SendMediaMessageParams {
  to: string;
  caption?: string;
  media_url: string;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface SessionStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'qr';
  qr?: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
}

/**
 * WASender API Client Class
 */
export class WASenderAPI {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: WASenderConfig) {
    this.apiKey = config.apiKey;
    const baseUrl = config.baseUrl || 'https://wasenderapi.com/whatsapp';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Send a text message
   */
  async sendTextMessage(params: SendTextMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-text', {
        to: params.to,
        message: params.message,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendTextMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send message',
      };
    }
  }

  /**
   * Send an image message
   */
  async sendImageMessage(params: SendMediaMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-image', {
        to: params.to,
        caption: params.caption || '',
        image_url: params.media_url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendImageMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send image',
      };
    }
  }

  /**
   * Send a video message
   */
  async sendVideoMessage(params: SendMediaMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-video', {
        to: params.to,
        caption: params.caption || '',
        video_url: params.media_url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendVideoMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send video',
      };
    }
  }

  /**
   * Send a document message
   */
  async sendDocumentMessage(params: SendMediaMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-document', {
        to: params.to,
        caption: params.caption || '',
        document_url: params.media_url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendDocumentMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send document',
      };
    }
  }

  /**
   * Send an audio message
   */
  async sendAudioMessage(params: SendMediaMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-audio', {
        to: params.to,
        audio_url: params.media_url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendAudioMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send audio',
      };
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(): Promise<SessionStatus | null> {
    try {
      const response = await this.client.get('/api/status');
      
      return {
        status: response.data.status || 'disconnected',
        qr: response.data.qr,
        user: response.data.user,
      };
    } catch (error: any) {
      console.error('WASender API Error (getSessionStatus):', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(): Promise<any> {
    try {
      const response = await this.client.get('/api/user');
      return response.data;
    } catch (error: any) {
      console.error('WASender API Error (getUserInfo):', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Check if a number is on WhatsApp
   */
  async checkNumberOnWhatsApp(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/on-whatsapp/${phoneNumber}`);
      return response.data.exists === true;
    } catch (error: any) {
      console.error('WASender API Error (checkNumberOnWhatsApp):', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send presence update (typing, recording, etc.)
   */
  async sendPresenceUpdate(to: string, type: 'typing' | 'recording' | 'available'): Promise<boolean> {
    try {
      await this.client.post('/api/send-presence-update', {
        to,
        type,
      });
      return true;
    } catch (error: any) {
      console.error('WASender API Error (sendPresenceUpdate):', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Create a WASender API client instance
 */
export function createWASenderClient(apiKey: string, baseUrl?: string): WASenderAPI {
  return new WASenderAPI({ apiKey, baseUrl });
}
