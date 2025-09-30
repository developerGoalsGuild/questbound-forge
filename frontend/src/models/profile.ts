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
}

export interface ProfileValidationErrors {
  [key: string]: string | undefined;
}

export interface CountryOption { code: string; name: string }
export interface LanguageOption { code: string; name: string }


