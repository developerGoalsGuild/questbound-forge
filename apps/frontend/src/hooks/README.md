# Language System

## Overview

The language system now automatically detects and applies the user's preferred language based on their profile settings, with intelligent fallbacks for unauthenticated users.

## Language Detection Priority

1. **User Profile Language** - If user is authenticated and has a saved language preference
2. **Browser Language** - If user is not authenticated or profile language is unsupported
3. **Default (English)** - Final fallback if browser language is not supported

## Components

### `useLanguageInitialization`
- Detects the appropriate language on app startup
- Handles authentication state and profile fetching
- Provides browser language detection with error handling
- Returns loading state and error information

### `useTranslation` (Enhanced)
- Now includes automatic language initialization
- Provides `isLanguageLoading` state for UI feedback
- Maintains backward compatibility with existing `changeLanguage` function

### `useLanguage` (Existing)
- Handles language changes and updates user profile
- Shows success/error notifications
- Provides available language options

## Usage

The language system works automatically - no changes needed in existing components. The `TranslationProvider` will:

1. Check if user is authenticated
2. Fetch user profile and extract language preference
3. Fall back to browser language if needed
4. Apply the detected language to the entire app

## Supported Languages

- `en` - English
- `es` - Spanish (Español)
- `fr` - French (Français)

## Error Handling

- Profile fetch failures fall back to browser language
- Unsupported profile languages fall back to browser language
- Browser language detection errors fall back to English
- All errors are logged for debugging

## Performance

- Language detection happens once on app initialization
- Profile is only fetched if user is authenticated
- No unnecessary API calls for unauthenticated users
- Caching prevents repeated profile fetches during language changes
