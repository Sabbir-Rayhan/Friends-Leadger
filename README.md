# Friend Ledger

Track money lent between friends. Every loan and every repayment must be confirmed by the other person, and each friend circle is private to its members.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Neon Postgres · Drizzle ORM · Better Auth · Vercel

---

## Setup guide (do these in order)

### Step 1. Install requirements
- Node.js 20 or newer (check with `node -v`)
- A free account at https://neon.com
- (Optional) a GitHub account for deploying to Vercel

### Step 2. Install the project
```bash
unzip friend-ledger.zip
cd friend-ledger
npm install
```

### Step 3. Create the Neon database
1. Go to https://console.neon.tech and create a project (region: AWS Singapore is closest to Bangladesh).
2. Click **Connect** on the dashboard and copy the connection string. It looks like `postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.

### Step 4. Create `.env.local`
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | the Neon connection string from step 3 |
| `BETTER_AUTH_SECRET` | run `openssl rand -base64 32` and paste the result (any long random string works) |
| `BETTER_AUTH_URL` | `http://localhost:3000` for now |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | leave empty (optional, see the Google login section) |

### Step 5. Create the database tables
```bash
npm run db:migrate
```
This runs the SQL in the `drizzle/` folder. Check the **Tables** page in the Neon dashboard: you should see `user`, `circles`, `loans`, `repayments`, `notifications` and more.

### Step 6. Run the app
```bash
npm run dev
```
Open http://localhost:3000.

### Step 7. Test it with two accounts
1. Sign up as Friend A in a normal browser window, create a circle, copy the invite link.
2. Open a **private/incognito window**, sign up as Friend B, paste the invite link, click Join.
3. As A: "Record money I lent" to B. As B: see the notification, then Confirm.
4. As B: "I paid back some money". As A: click "I received it".
5. Create a second circle with a third account to verify that circles can't see each other.

### Step 8. Deploy to Vercel
1. Push the project to GitHub (`.env.local` is already git-ignored).
2. On https://vercel.com click **Add New, Project**, and import the repo.
3. Before deploying, add **Environment Variables**: `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` (set this to your final Vercel URL, e.g. `https://friend-ledger.vercel.app`).
4. Deploy. The tables already exist in Neon from step 5, so nothing else is needed.
5. If you change `BETTER_AUTH_URL` later, redeploy.

### Optional: Google login
1. Google Cloud Console, **APIs & Services, Credentials, Create OAuth client ID** (Web application).
2. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://YOUR-APP.vercel.app/api/auth/callback/google`.
3. Put the client id and secret in `.env.local` (and in Vercel). The "Continue with Google" button appears automatically.

---

## Where things live (what to edit for what)

| I want to change... | Edit this |
|---|---|
| Database tables | `src/db/schema.ts`, then `npm run db:generate` and `npm run db:migrate` |
| Login / signup behavior | `src/lib/auth.ts`, `src/components/AuthForm.tsx` |
| Business rules (who can confirm, validation) | `src/actions/loans.ts`, `src/actions/repayments.ts` |
| Circle create / join / invite codes | `src/actions/circles.ts` |
| What each person is allowed to see | `src/data/queries.ts` (visibility), `src/lib/permissions.ts` (membership check) |
| Who-owes-whom calculation | `src/lib/balances.ts` |
| Currency symbol / number formatting | `src/lib/money.ts` |
| Pages and layout | `src/app/...` |
| Loan card UI | `src/components/LoanCard.tsx` |
| Notification texts | `src/app/(app)/notifications/page.tsx` |

## How the security works
- **Circle isolation:** the circle page returns 404 unless you are a member (`getCircleForMember`), and every loan query filters by that circle.
- **Only you change your own records:** the rules are in the SQL `WHERE` clauses of the server actions (for example, only the borrower can confirm a pending loan; only the lender can confirm a repayment). Hiding a button in the UI is never the only protection.
- **Money is exact:** amounts are stored as `numeric(12,2)` and calculated in integer paisa, never floating point.
- **Database guards:** amounts must be positive and nobody can lend to themselves, enforced by database constraints.

## Rules of the app
- Only the **lender** creates a loan; it starts as *pending* and only counts after the **borrower confirms**.
- Only the **borrower** records a repayment; it only counts after the **lender confirms** ("I received it") or is disputed.
- Everyone in a circle sees pending and confirmed loans. Rejected or cancelled loans are visible only to the two people involved.
- Balances count **confirmed** loans and repayments only.

## Known limitations / ideas for later
- No email notifications (in-app only). Resend's free tier would be a good next step.
- No "leave circle" / remove member / delete account yet.
- No rate limiting on login or join codes.
- Loans can't be edited after creation. Cancel a pending one and re-create it.
- Vercel preview URLs differ from `BETTER_AUTH_URL`; log in on the production URL.
