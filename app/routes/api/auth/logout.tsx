import type { ActionFunctionArgs } from '@react-router/node';
import { json } from '@react-router/node';
import { requireAuth } from '~/lib/middleware/auth';

export const action = requireAuth(async ({ request }) => {
  try {
    // In a production app, you might want to:
    // 1. Invalidate the refresh token in a database
    // 2. Log the logout event
    // 3. Clear any server-side session data
    
    const response = json({ message: 'Logout successful' });
    
    // Clear authentication cookies
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', 'access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    
    return new Response(response.body, { ...response, headers });
    
  } catch (error) {
    console.error('Logout error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});