export interface SettingsState {
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: "vi" | "en";
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}
