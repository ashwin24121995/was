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

export interface SendStickerMessageParams {
  to: string;
  sticker_url: string; // Must be .webp format
}

export interface SendContactCardParams {
  to: string;
  contact: {
    name: string;
    phone: string;
    organization?: string;
  };
}

export interface SendLocationParams {
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendPollParams {
  to: string;
  question: string;
  options: string[];
  multipleAnswers?: boolean;
}

export interface SendQuotedMessageParams {
  to: string;
  message: string;
  quotedMessageId: string; // ID of the message being replied to
}

export interface SendViewOnceMessageParams {
  to: string;
  media_url: string;
  mediaType: 'image' | 'video';
  caption?: string;
}

export interface EditMessageParams {
  messageId: string;
  newText: string;
}

export interface DeleteMessageParams {
  messageId: string;
}

export interface UploadMediaParams {
  file: Buffer | Uint8Array;
  filename: string;
  mimetype: string;
}

export interface UploadMediaResponse {
  success: boolean;
  url?: string;
  error?: string;
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
    const baseUrl = config.baseUrl || 'https://wasenderapi.com';

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
      const response = await this.client.post('/api/send-message', {
        to: params.to,
        text: params.message,
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
   * Send a sticker message (.webp format only)
   */
  async sendStickerMessage(params: SendStickerMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-sticker', {
        to: params.to,
        sticker_url: params.sticker_url,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendStickerMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send sticker',
      };
    }
  }

  /**
   * Send a contact card
   */
  async sendContactCard(params: SendContactCardParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-contact', {
        to: params.to,
        contact: params.contact,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendContactCard):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send contact card',
      };
    }
  }

  /**
   * Send a location message
   */
  async sendLocation(params: SendLocationParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-location', {
        to: params.to,
        latitude: params.latitude,
        longitude: params.longitude,
        name: params.name,
        address: params.address,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendLocation):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send location',
      };
    }
  }

  /**
   * Send a poll message
   */
  async sendPoll(params: SendPollParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-poll', {
        to: params.to,
        question: params.question,
        options: params.options,
        multipleAnswers: params.multipleAnswers || false,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendPoll):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send poll',
      };
    }
  }

  /**
   * Send a quoted/reply message
   */
  async sendQuotedMessage(params: SendQuotedMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.post('/api/send-message', {
        to: params.to,
        text: params.message,
        quotedMessageId: params.quotedMessageId,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendQuotedMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send quoted message',
      };
    }
  }

  /**
   * Send a view-once message (disappearing media)
   */
  async sendViewOnceMessage(params: SendViewOnceMessageParams): Promise<MessageResponse> {
    try {
      const endpoint = params.mediaType === 'image' ? '/api/send-image' : '/api/send-video';
      const mediaKey = params.mediaType === 'image' ? 'image_url' : 'video_url';

      const response = await this.client.post(endpoint, {
        to: params.to,
        [mediaKey]: params.media_url,
        caption: params.caption,
        viewOnce: true,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (sendViewOnceMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send view-once message',
      };
    }
  }

  /**
   * Edit a message
   */
  async editMessage(params: EditMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.put(`/api/messages/${params.messageId}`, {
        text: params.newText,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (editMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to edit message',
      };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(params: DeleteMessageParams): Promise<MessageResponse> {
    try {
      const response = await this.client.delete(`/api/messages/${params.messageId}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('WASender API Error (deleteMessage):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete message',
      };
    }
  }

  /**
   * Get message info (delivery status, read receipts)
   */
  async getMessageInfo(messageId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/messages/${messageId}/info`);
      return response.data;
    } catch (error: any) {
      console.error('WASender API Error (getMessageInfo):', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Upload media file to WASender
   * Note: This method expects the file to be uploaded from the client side
   * For server-side uploads, use a different approach with proper file handling
   */
  async uploadMedia(params: UploadMediaParams): Promise<UploadMediaResponse> {
    try {
      // For server-side, we'll send the file as base64
      const base64Data = Buffer.from(params.file).toString('base64');
      
      const response = await this.client.post('/api/upload', {
        file: base64Data,
        filename: params.filename,
        mimetype: params.mimetype,
      });

      return {
        success: true,
        url: response.data.url,
      };
    } catch (error: any) {
      console.error('WASender API Error (uploadMedia):', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload media',
      };
    }
  }

  /**
   * Decrypt media file from WASender
   */
  async decryptMedia(encryptedUrl: string): Promise<string | null> {
    try {
      const response = await this.client.post('/api/decrypt-media', {
        url: encryptedUrl,
      });

      return response.data.decryptedUrl || null;
    } catch (error: any) {
      console.error('WASender API Error (decryptMedia):', error.response?.data || error.message);
      return null;
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
