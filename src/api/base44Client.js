import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6ace6b4035ee84d8810b7215",
  serverUrl: window.location.origin,
  requiresAuth: true // Ensure authentication is required for all operations
});
