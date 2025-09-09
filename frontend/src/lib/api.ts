import { generateClient } from "aws-amplify/api";
import { IS_EMAIL_AVAILABLE, IS_NICKNAME_AVAILABLE } from "@/graphql/queries";

export interface CreateUserInput {
  email: string;
  fullName?: string;
  password?: string;
  status?: string;
  [key: string]: any;
}

const client = generateClient(); // GraphQL client (still used for other ops)


/*const client = generateClient({
  authMode: "lambda",
  authToken: () => myGetToken(), // Lambda authorizer token
});*/

export async function createUser(input: CreateUserInput) {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error('API base URL not configured');
  const url = base.replace(/\/$/, '') + '/users/signup';
  const payload: any = {
    provider: 'local',
    email: input.email,
    password: input.password,
    name: input.fullName,
    // pass through optional profile fields if present
    nickname: input.nickname,
    birthDate: input.birthDate,
    country: input.country,
    language: input.language,
    gender: input.gender,
    pronouns: input.pronouns,
    bio: input.bio,
    tags: input.tags,
    status: input.status || 'email confirmation pending'
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    const msg = body?.detail || body?.message || text || 'Signup failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body;
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
