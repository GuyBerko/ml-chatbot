export interface User {
  userId: number;
  firstName?: string;
  lastName?: string;
  fullName: string;
  authorized: boolean;
  isSubscribe: boolean;
  isNew: boolean;
  phoneNumber?: string;
  interactionsCount?: number;
  totalInteractions: number;
  lastUserMessageId?: number;
  lastBotTextId?: number;
  lastBotVoiceId?: number;
  createdAt?: number;
  creationPlatform: string;
  recivedOnBoard: boolean;
  lang?: string;
  lastUserMessageDate?: Date;
  lastDailyPractice?: Date;
}

export interface UsersCache {
  [key: number]: User;
}
