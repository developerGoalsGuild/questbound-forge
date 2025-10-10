export interface NotificationPreferences {
  questStarted: boolean;
  questCompleted: boolean;
  questFailed: boolean;
  progressMilestones: boolean;
  deadlineWarnings: boolean;
  streakAchievements: boolean;
  challengeUpdates: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

export interface ProfileFormData {
  fullName?: string;
  nickname?: string;
  birthDate?: string;
  country?: string;
  language?: string;
  gender?: string;
  pronouns?: string;
  bio?: string;
  tags?: string[];
  notificationPreferences?: NotificationPreferences;
}

export interface ProfileValidationErrors {
  [key: string]: string | undefined;
}

export interface CountryOption { code: string; name: string }
export interface LanguageOption { code: string; name: string }


