import { type LoaderFunctionArgs } from "react-router";
import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    return Response.json({ error: 'Verification token is required' }, { status: 400 });
  }

  try {
    // Find user with matching token that hasn't expired
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        email_verified: users.email_verified,
        token_expires: users.token_expires
      })
      .from(users)
      .where(
        and(
          eq(users.verification_token, token),
          gt(users.token_expires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      // Token not found or expired
      return new Response(`
        <html>
          <head>
            <title>Verification Failed - Tweeter</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
              }
              .icon { font-size: 48px; margin-bottom: 20px; }
              .error { color: #dc3545; }
              h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
              p { color: #666; line-height: 1.6; margin-bottom: 24px; }
              .btn { 
                background: #1DA1F2; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                display: inline-block;
              }
              .btn:hover { background: #0d8bd9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon error">❌</div>
              <h1>Verification Failed</h1>
              <p>This verification link is invalid or has expired. Please request a new verification email from your account settings.</p>
              <a href="/login" class="btn">Back to Login</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (user.email_verified) {
      // Already verified
      return new Response(`
        <html>
          <head>
            <title>Already Verified - Tweeter</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
              }
              .icon { font-size: 48px; margin-bottom: 20px; }
              .success { color: #28a745; }
              h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
              p { color: #666; line-height: 1.6; margin-bottom: 24px; }
              .btn { 
                background: #1DA1F2; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                font-weight: bold;
                display: inline-block;
              }
              .btn:hover { background: #0d8bd9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon success">✅</div>
              <h1>Already Verified</h1>
              <p>Your email address has already been verified. You can now log in to your Tweeter account.</p>
              <a href="/login" class="btn">Go to Login</a>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verify the email
    await db
      .update(users)
      .set({
        email_verified: true,
        verification_token: null,
        token_expires: null,
        updated_at: new Date()
      })
      .where(eq(users.id, user.id));

    // Success response
    return new Response(`
      <html>
        <head>
          <title>Email Verified - Tweeter</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8f9fa;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 500px;
              width: 100%;
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .success { color: #28a745; }
            h1 { color: #333; margin-bottom: 16px; font-size: 28px; }
            p { color: #666; line-height: 1.6; margin-bottom: 24px; }
            .btn { 
              background: #1DA1F2; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: bold;
              display: inline-block;
            }
            .btn:hover { background: #0d8bd9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon success">🎉</div>
            <h1>Email Verified!</h1>
            <p>Thank you, <strong>${user.username}</strong>! Your email address has been successfully verified. You can now access all Tweeter features.</p>
            <a href="/login" class="btn">Start Tweeting</a>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}