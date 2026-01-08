# React Frontend Development Guidelines

## 1. Coding Style Preferences

### 1.1 Indentation & Formatting
- Use 2 spaces per indentation level (no tabs).
- Maximum line length: 80 characters recommended, 120 characters max.
- Use semicolons consistently (recommended to enable ESLint rule for this).
- Use single quotes for strings, except when the string contains a single quote.
- Use trailing commas in multi-line objects, arrays, and function parameters.
- Use Prettier for automatic code formatting.

### 1.2 Naming Conventions
- **Components:** PascalCase (e.g., `UserProfile`, `GoalList`)
- **Variables and functions:** camelCase (e.g., `userName`, `fetchUserData`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Files:** kebab-case or camelCase (e.g., `user-profile.tsx` or `userProfile.tsx`)
- **Folders:** kebab-case (e.g., `user-profile/`)

### 1.3 File & Folder Organization
- Group files by feature or domain, not by type.
- Typical structure:
  ```
  src/
    components/       # Reusable UI components
    features/         # Feature-specific components and logic
      auth/
        AuthPage.tsx
        authSlice.ts
        components/
      goals/
        GoalList.tsx
        goalAPI.ts
        components/
    hooks/            # Custom React hooks
    utils/            # Utility functions
    styles/           # Global styles and themes
    assets/           # Static assets (images, icons)
  ```
- Co-locate related files (e.g., component, styles, tests) within the same folder.

### 1.4 Best Practices for Component Structure
- Use **function components** exclusively.
- Use **React hooks** for state and lifecycle management.
- Prefer **small, reusable components**.
- Separate presentational and container components when complexity grows.
- Use **PropTypes** or TypeScript for type safety (TypeScript strongly recommended).
- Use **defaultProps** or default parameters for optional props.
- Avoid inline functions and objects in JSX props to prevent unnecessary re-renders.
- Use **React.memo** to optimize pure functional components.
- Use **useCallback** and **useMemo** hooks to memoize functions and values.

### 1.5 State Management
- Use React's built-in **useState** and **useReducer** for local component state.
- For global or shared state, use **React Context** or state management libraries such as:
  - **Redux Toolkit** (recommended for complex global state)
  - **Recoil** or **Zustand** (for simpler or more flexible state management)
- Keep state minimal and normalized.
- Avoid deeply nested state; split into smaller slices.
- Use **React Query** or **SWR** for server state and data fetching.
- Use **custom hooks** to encapsulate reusable stateful logic.

### 1.6 Side Effects & Data Fetching
- Use **useEffect** for side effects.
- Clean up subscriptions or timers in the cleanup function.
- Use **async/await** syntax for asynchronous operations.
- Handle loading, error, and empty states explicitly in UI.
- Use **React Query** or **SWR** for caching, background updates, and retries.

### 1.7 Testing
- Use **Jest** and **React Testing Library** for unit and integration tests.
- Write tests for components, hooks, and utilities.
- Test user interactions and accessibility where applicable.
- Maintain high test coverage on critical components.

### 1.8 Accessibility
- Use semantic HTML elements.
- Use ARIA attributes where necessary.
- Test with screen readers and keyboard navigation.
- Use tools like **axe-core** for automated accessibility testing.

### 1.9 Internationalization (i18n)
- Use **react-i18next** or similar libraries.
- All user-facing strings must be localized.
- Organize translation files by language and feature.

---

## 2. Tooling & Configuration

### 2.1 Linting & Formatting
- Use **ESLint** with recommended React and TypeScript plugins.
- Use **Prettier** for code formatting.
- Integrate linting and formatting into CI pipelines.
- Example ESLint config includes:
  - `eslint-plugin-react`
  - `eslint-plugin-react-hooks`
  - `@typescript-eslint/eslint-plugin`

### 2.2 TypeScript
- Use TypeScript for all React code.
- Enable strict mode in `tsconfig.json`.
- Use interfaces or types for props and state.
- Avoid `any` type; prefer explicit typing.

### 2.3 Build & Dev Server
- Use **Vite** as the build tool and dev server.
- Configure Vite for React and TypeScript support.
- Enable fast refresh and source maps.

### 2.4 Testing Setup
- Configure Jest with `ts-jest` for TypeScript support.
- Use React Testing Library for DOM testing.
- Setup coverage reporting.

---

## 3. Examples

### 3.1 Functional Component Example
```tsx
import React, { FC, useState, useCallback } from 'react';

interface UserProfileProps {
  userName: string;
}

const UserProfile: FC<UserProfileProps> = ({ userName }) => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount(c => c + 1), []);

  return (
    <div>
      <h1>Hello, {userName}</h1>
      <button onClick={increment}>Clicked {count} times</button>
    </div>
  );
};

export default React.memo(UserProfile);
```

### 3.2 Custom Hook Example
```tsx
import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
```

---

## 4. References & Further Reading

- [React Official Docs](https://reactjs.org/docs/getting-started.html)
- [TypeScript with React](https://www.typescriptlang.org/docs/handbook/react.html)
- [React Hooks Rules](https://reactjs.org/docs/hooks-rules.html)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [ESLint React Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [Prettier](https://prettier.io/)
- [React Query](https://react-query.tanstack.com/)
- [React i18next](https://react.i18next.com/)

---

**This document replaces all previous Flutter-specific frontend guidelines and is the authoritative source for React frontend development in this project.**
