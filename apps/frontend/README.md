# React Sign-Up Pages with AWS AppSync and i18n

## Overview

This project contains two React sign-up pages integrated with AWS AppSync for user creation and a simulated email confirmation service. It supports multi-language translations (English, Spanish, French) using the existing i18n framework.

## Features

- Local User Sign-Up with full form validation and password confirmation.
- Social Login Sign-Up with pre-filled, read-only email.
- Calls AWS AppSync GraphQL resolver `createuser.js` to create users.
- Calls `user-service` method `confirmEmail` to send verification emails.
- Multi-language support for all UI text and validation messages.
- Environment-specific AWS Amplify configuration for development and production.
- Comprehensive unit tests for both sign-up pages.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables and AWS Amplify:

- Update `frontend/src/config/aws-exports.prod.ts` with your production AppSync endpoint.
- Development config is pre-filled with the provided dev endpoint.

3. Run the development server:

```bash
npm run dev
```

## Usage

- Import and use `<LocalSignUp />` for local user registration.
- Import and use `<SocialSignUp email="user@example.com" />` for social login registration.

## Testing

Run unit tests with:

```bash
npm test
```

Tests cover form validation, submission success, error handling, and UI rendering in multiple languages.

## Notes

- The `confirmEmail` function is simulated and should be replaced with actual backend integration.
- The user status is set to `"email confirmation pending"` on creation to reflect email verification state.
- The AWS Amplify configuration is designed to be flexible for future JWT token support.

## File Structure

- `src/config/` - AWS Amplify environment configs.
- `src/components/signup/` - Sign-up page components and tests.
- `src/lib/api.ts` - API calls to AppSync and user-service.
- `src/i18n/translations.ts` - Multi-language translations.

## Contact

For questions or support, please contact the development team.
