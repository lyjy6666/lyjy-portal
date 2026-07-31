// TTS 模块共享类型

export interface TtsUser {
  id: number;
  username: string;
  isVip: boolean;
  vipExpiresAt: string | null;
  trialUsed: boolean;
}
