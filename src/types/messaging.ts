export type MessageChannel =
  | 'facebook_messenger'
  | 'slack'
  | 'telegram'
  | 'whatsapp'
  | 'twilio_sms'
  | 'custom_webhook';

export type ImpactSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CTAButton {
  title: string;
  payloadOrUrl: string;
  type: 'web_url' | 'postback';
}

export interface QuickReply {
  content_type: 'text';
  title: string;
  payload: string;
}

export interface MessageContent {
  title?: string;
  text: string;
  formattedMarkdown?: string;
  mediaUrl?: string;
  buttons?: CTAButton[];
  quickReplies?: QuickReply[];
}

export interface UnifiedMessageRequest {
  appId?: string;
  apiKey?: string;
  channel: MessageChannel;
  recipientId: string; // FB PSID, Slack Channel ID, Telegram Chat ID, Phone number, or Webhook URL
  content: MessageContent;
  metadata?: Record<string, any>;
  severity?: ImpactSeverity;
}

export interface MessageSendResult {
  success: boolean;
  messageId?: string;
  channel: MessageChannel;
  recipientId: string;
  error?: string;
  latencyMs: number;
  timestamp: string;
  isSimulated?: boolean;
  providerResponse?: any;
}

export interface ChannelConfig {
  id: MessageChannel;
  name: string;
  icon: string;
  description: string;
  isConfigured: boolean;
  isActive: boolean;
  settings: Record<string, string>;
  supportedFeatures: {
    media: boolean;
    buttons: boolean;
    quickReplies: boolean;
    markdown: boolean;
    webhooks: boolean;
  };
}

export interface ClientApp {
  id: string;
  name: string;
  apiKey: string;
  description: string;
  createdDate: string;
  activeChannels: MessageChannel[];
  rateLimitPerMin: number;
  totalSent: number;
  lastUsedAt: string | null;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'ALERT' | 'CONFIRMATION' | 'MARKETING' | 'SECURITY' | 'DIGEST';
  channel: MessageChannel | 'ALL';
  description: string;
  titlePattern?: string;
  bodyPattern: string;
  variables: string[];
}

export interface DispatchLogEntry {
  id: string;
  appId: string;
  appName: string;
  channel: MessageChannel;
  recipientId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  payload: UnifiedMessageRequest;
  result: MessageSendResult;
  latencyMs: number;
  timestamp: string;
}

export interface GatewayAnalytics {
  totalDispatches: number;
  successfulDispatches: number;
  failedDispatches: number;
  averageLatencyMs: number;
  dispatchesByChannel: Record<MessageChannel, number>;
  dispatchesByApp: Record<string, number>;
  throughput24h: Array<{ hour: string; count: number; failures: number }>;
}
