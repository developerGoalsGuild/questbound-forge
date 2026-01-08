export interface SubscriptionKeyResponse {
  apiKey: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AvailabilityKeyResponse {
  apiKey: string;
  expiresAt: string;
}

export interface SubscriptionKeyCipherResponse {
  ciphertext: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
}
