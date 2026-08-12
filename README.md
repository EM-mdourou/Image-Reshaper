# Image Reshaper — V7.35

## V7.35 fixes

### Text edit crash fixed
`Apply text changes` no longer references `explicitBaseState`, which only exists inside the Modify workflow. Large-format text edits now use the current rendered design as their visual baseline without throwing `explicitBaseState is not defined`.

## Authentication
V7.35 adds a login page and protects the main application/API with an authenticated session cookie.

### Initial account
- Username: `admin`
- Role: `admin`

The initial password is **not stored as plaintext anywhere in the repository**. Only a salted scrypt password hash is used to seed the database record.

### Required Vercel environment variables
Add these to the Vercel project before deploying:

- `DATABASE_URL` (or `POSTGRES_URL`) — PostgreSQL/Neon connection string
- `SESSION_SECRET` — a random secret of at least 32 characters

Example secret generation from a local terminal:

```bash
openssl rand -hex 32
```

Do not commit either environment variable to GitHub.

### Database behavior
On the first login request, the application automatically creates the `image_reshaper_users` table if it does not exist and seeds the initial `admin` user using the pre-computed salted scrypt hash. Later users can be added to the same table without changing the login architecture.

### Security
- Passwords are verified using Node's `scrypt` implementation.
- Password plaintext is never embedded in the browser JavaScript or HTML.
- The signed session is stored in an `HttpOnly`, `SameSite=Lax` cookie.
- Production cookies are marked `Secure`.
- The application and reshape APIs are protected by Vercel middleware.

## Deployment
After uploading V7.35 to GitHub/Vercel:

1. Add a PostgreSQL/Neon database to the Vercel project.
2. Set `DATABASE_URL`.
3. Set a strong `SESSION_SECRET` (32+ characters).
4. Redeploy.
5. Open the site; unauthenticated users will be redirected to `/login.html`.

## Previous functionality retained
- previous-version modification diagnostics
- current-design preservation workflow
- larger accordion controls/backgrounds
- source-element reuse messaging
- version history and PNG downloads
