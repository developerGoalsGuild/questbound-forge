import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      status
    }
  }
`;

export const CREATE_GOAL = gql`
  mutation CreateGoal($input: GoalInput!) {
    createGoal(input: $input) {
      id
      userId
      title
      description
      tags
      deadline
      NlpAnswers
      status
      createdAt
      updatedAt
    }
  }
`;

export const ADD_TASK = gql`
  mutation AddTask($input: TaskInput!) {
    addTask(input: $input) {
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
