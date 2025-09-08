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
