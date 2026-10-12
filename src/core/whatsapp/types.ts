export type WhatsAppMessage = {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'sticker' | 'location' | 'contacts' | 'reaction';
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string; sha256: string; voice?: boolean };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
};

export type WhatsAppStatus = {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipient_id: string;
  timestamp: string;
};

export type WhatsAppProvider = 'cloud' | 'baileys';

export type TemplateStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export type TemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | 'INTERACTIVE';

export type Template = {
  name: string;
  language: string;
  status: TemplateStatus;
  category: TemplateCategory;
  content: Record<string, unknown>;
  components?: Record<string, unknown>[];
};

export interface IWhatsAppProvider {
  sendText(to: string, text: string): Promise<{ messageId: string }>;
  sendTemplate(to: string, template: Template, variables?: string[]): Promise<{ messageId: string }>;
  downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }>;
}
