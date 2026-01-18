export interface BlastMetrics {
  sent: number;
  received: number;
  read: number;
  replied: number;
  closed: number;
}

export interface WSAPMESendMessageRequest {
  device: string;
  to: string;
  message: string;
  priority?: string;
  exclude_group?: number[];
}

export interface WSAPMESendMessageResponse {
  success: boolean;
  message?: string;
  data?: any;
  messageId?: string;
}

export interface WSAPMEMessageInfoRequest {
  id_device: string;
  jid: string;
  messages: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    status?: number;
    [key: string]: any;
  };
}

export interface WSAPMEMessageInfoResponse {
  success?: boolean;
  status?: number;
  data?: any;
  [key: string]: any;
}

export interface FunnelStage {
  label: string;
  count: number;
  percentage: number;
}

