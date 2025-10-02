export const MY_PROFILE = /* GraphQL */ `
  query MyProfile {
    myProfile {
      id
      email
      role
      fullName
      nickname
      birthDate
      status
      country
      language
      gender
      pronouns
      bio
      tags
      tier
      createdAt
      updatedAt
    }
  }
`;

import { gql } from '@apollo/client';

export const IS_EMAIL_AVAILABLE = gql`
  query IsEmailAvailable($email: String!) {
    isEmailAvailable(email: $email)
  }
`;


export const IS_NICKNAME_AVAILABLE = gql`
  query IsNicknameAvailable($nickname: String!) {
    isNicknameAvailable(nickname: $nickname)
  }
`;

export const IS_NICKNAME_AVAILABLE_FOR_USER = /* GraphQL */ `
  query IsNicknameAvailableForUser($nickname: String!) {
    isNicknameAvailableForUser(nickname: $nickname)
  }
`;

// Goals by user (minimal fields for counting)
export const GOALS_BY_USER = gql`
  query Goals($userId: ID!) {
    goals(userId: $userId) {
      id
      status
    }
  }
`;
export const ACTIVE_GOALS_COUNT = gql`
  query ActiveGoalsCount($userId: ID!) {
    activeGoalsCount(userId: $userId)
  }
`;

export const MY_GOALS = gql`
  query MyGoals {
    myGoals {
      id
      title
      description
      category
      tags
      deadline
      status
      createdAt
      updatedAt
      answers {
        key
        answer
      }
    }
  }
`;

export const GET_GOAL = gql`
  query GetGoal($goalId: ID!) {
    goal(goalId: $goalId) {
      id
      title
      description
      category
      tags
      deadline
      status
      createdAt
      updatedAt
      answers {
        key
        answer
      }
    }
  }
`;

export const MY_TASKS = gql`
  query MyTasks($goalId: ID!) {
    myTasks(goalId: $goalId) {
      id
      goalId
      title
      dueAt
      status
      nlpPlan
      createdAt
      updatedAt
    }
  }
`;

// TypeScript interfaces for GraphQL responses
export interface DashboardGoal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  deadline?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface DashboardGoalsResponse {
  myDashboardGoals: DashboardGoal[];
}

export interface DashboardGoalsMinimalResponse {
  myDashboardGoals: Array<{
    id: string;
    title: string;
    category?: string;
    deadline?: string;
    status: string;
    createdAt: number;
    tags: string[];
  }>;
}

// Dashboard Goals Query - Optimized for top 3 goals display with backend filtering
export const DASHBOARD_GOALS = gql`
  query DashboardGoals($limit: Int, $status: String, $sortBy: String) {
    myDashboardGoals(limit: $limit, status: $status, sortBy: $sortBy) {
      id
      title
      description
      category
      deadline
      status
      createdAt
      updatedAt
      tags
    }
  }
`;

// Minimal query for just the count and basic info (for performance)
export const DASHBOARD_GOALS_MINIMAL = gql`
  query DashboardGoalsMinimal($limit: Int, $status: String) {
    myDashboardGoals(limit: $limit, status: $status) {
      id
      title
      category
      deadline
      status
      createdAt
      tags
    }
  }
`;

// Top 3 Active Goals - Optimized for dashboard display
export const DASHBOARD_TOP_GOALS = gql`
  query DashboardTopGoals($sortBy: String) {
    myDashboardGoals(limit: 3, status: "active", sortBy: $sortBy) {
      id
      title
      description
      category
      deadline
      status
      createdAt
      updatedAt
      tags
    }
  }
`;
