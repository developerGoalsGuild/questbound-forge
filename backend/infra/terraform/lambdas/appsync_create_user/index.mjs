// appsync_create_user Lambda handler
// Receives AppSync invocation payload and calls the existing API Gateway user-service /users/signup endpoint
// Securely forwards only required fields and never logs sensitive data


function validatePasswordStrength(pwd) {
  const s = String(pwd || '');
  if (s.length < 8) throw new Error('Password must be at least 8 characters long.');
  if (!/[a-z]/.test(s)) throw new Error('Password must include at least one lowercase letter.');
  if (!/[A-Z]/.test(s)) throw new Error('Password must include at least one uppercase letter.');
  if (!/[0-9]/.test(s)) throw new Error('Password must include at least one digit.');
  if (!/[!@#$%^&*()\-_=+\[\]{};:,.?/]/.test(s)) throw new Error('Password must include at least one special character.');
}

export async function handler(event) {
  const baseUrl = process.env.USER_SERVICE_BASE_URL; // e.g., https://abc123.execute-api.region.amazonaws.com/dev
  // AppSync Lambda resolver payloads are forwarded as-is from the request mapping
  const input = (event && event.input) || {};
  const email = (input.email || '').trim();
  const password = input.password || '';
  const fullName = (input.fullName || '').trim();

  if (!baseUrl) throw new Error('USER_SERVICE_BASE_URL not configured');
  if (!email) throw new Error('email required');
  if (!password) throw new Error('password required');
  if (!fullName) throw new Error('fullName required');

  // Validate locally to fail fast before HTTP call
  validatePasswordStrength(password);

  const payload = {
    provider: 'local',
    email,
    password,
    name: fullName
  };

  const url = baseUrl.replace(/\/$/, '') + '/users/signup';
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    throw new Error('Signup service unreachable');
  }

  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!res.ok) {
    const message = (body && (body.detail || body.message)) || 'Signup failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  // Return minimal info; the resolver will construct GraphQL shape
  return { ok: true, message: (body && body.message) || 'ok' };
}
