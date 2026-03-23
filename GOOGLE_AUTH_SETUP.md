# Google Authentication Setup — My Way

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Name: `My Way Production`
7. Under **Authorized JavaScript origins**, add:
   - `https://myway-pi.vercel.app`
   - `http://localhost:3000` (for local development)
8. Under **Authorized redirect URIs**, add:
   - `https://myway-pi.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields:
   - App name: `My Way`
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`, `openid`
5. Save and continue
6. Under **Test users**, add your email for testing
7. Publish the app when ready for production

## Step 3: Add Environment Variables

### On Vercel:

Go to your Vercel project settings > Environment Variables and add:

```
GOOGLE_CLIENT_ID=<your-client-id-from-step-1>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-step-1>
AUTH_SECRET=<generate-with-command-below>
```

Generate AUTH_SECRET:
```bash
openssl rand -base64 32
```

### For local development:

Add to `/workspace/myway/apps/app/.env.local`:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AUTH_SECRET=your-random-secret
```

## Step 4: Redeploy

After adding environment variables on Vercel, trigger a redeployment:
```bash
vercel --prod
```

## Step 5: Test

1. Visit `https://myway-pi.vercel.app/delivery`
2. You should see the login prompt
3. Click "Iniciar sesion" and sign in with Google
4. After signing in, you should be redirected to the delivery page
5. Your name should be pre-filled in the checkout form

## How It Works

- `/login` page shows the Google sign-in button
- `/delivery` page requires authentication
- Unauthenticated users see a prompt with a link to `/login`
- After Google sign-in, users are redirected back to `/delivery`
- Customer name is pre-filled from the Google profile
- User ID is attached to delivery orders for tracking

## Troubleshooting

- **"Error 400: redirect_uri_mismatch"** — Make sure the redirect URI in Google Console exactly matches: `https://myway-pi.vercel.app/api/auth/callback/google`
- **"Sign in with Google" does nothing** — Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Vercel env vars
- **Session not persisting** — Make sure AUTH_SECRET is set and consistent across deployments
