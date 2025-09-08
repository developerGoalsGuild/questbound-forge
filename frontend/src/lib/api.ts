import { generateClient } from "aws-amplify/api";
import { CREATE_USER } from "@/graphql/mutations";
import { IS_EMAIL_AVAILABLE, IS_NICKNAME_AVAILABLE } from "@/graphql/queries";

export interface CreateUserInput {
  email: string;
  fullName?: string;
  password?: string;
  status?: string;
  [key: string]: any;
}

const client = generateClient(); // create once and reuse


/*const client = generateClient({
  authMode: "lambda",
  authToken: () => myGetToken(), // Lambda authorizer token
});*/

export async function createUser(input: CreateUserInput) {
  const { data, errors } = await client.graphql({
    query: CREATE_USER,
    variables: { input },
    authMode: 'apiKey',
  });

  if (errors?.length) {
    throw new Error(errors.map(e => e.message).join(" | "));
  }
  return data; // e.g. data?.createUser depending on your schema
}

// Simulated user-service confirmEmail call
export async function confirmEmail(email: string) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log(`Confirmation email sent to ${email}`);
      resolve();
    }, 500);
  });
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const { data, errors } = await client.graphql({
    query: IS_EMAIL_AVAILABLE,
    variables: { email },
    authMode: 'apiKey',
  });
  if (errors?.length) {
    throw new Error(errors.map(e => e.message).join(" | "));
  }
  return Boolean((data as any)?.isEmailAvailable);
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, errors } = await client.graphql({
    query: IS_NICKNAME_AVAILABLE,
    variables: { nickname },
    authMode: 'apiKey',
  });
  if (errors?.length) {
    throw new Error(errors.map(e => e.message).join(" | "));
  }
  return Boolean((data as any)?.isNicknameAvailable);
}