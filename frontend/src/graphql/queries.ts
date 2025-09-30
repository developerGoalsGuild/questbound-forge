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
      tags
      deadline
      status
      createdAt
      updatedAt
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
