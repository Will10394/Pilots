# Deploying MPN Host Mapping to AWS Amplify

This package is a complete, ready-to-deploy Amplify Gen 2 app: a shared
database (no login — anyone with the link can read/write) plus the tool's
existing UI, wired to sync live across everyone who has it open.

## What's in this package

```
package.json          dependencies for the Amplify backend build
tsconfig.json          TypeScript config Amplify's build expects
amplify.yml            build spec: deploys the backend, then publishes the static site
amplify/
  backend.ts           wires the schema into the backend
  data/
    resource.ts         the actual schema (Part, Manufacturer, PilotConfig)
index.html              the tool itself, already wired to Amplify Data
```

## Deploy steps

1. **Push this folder to a git repo** (GitHub, GitLab, Bitbucket, or AWS CodeCommit).
   Amplify Hosting deploys from a connected repo — that's how it knows to
   rebuild the backend and republish the site whenever you push changes.

2. **In the AWS Amplify console**, choose "Host a web app" → connect that repo
   → select the branch. Amplify will detect `amplify.yml` and use it automatically.

3. **First deploy**: Amplify runs `npm ci`, then `npx ampx pipeline-deploy`,
   which provisions the actual backend (AppSync API + DynamoDB tables) and
   writes `amplify_outputs.json` with the API endpoint and public API key.
   That file gets published alongside `index.html` — the frontend fetches it
   at runtime, so there's nothing to hand-configure.

4. **Open the deployed URL.** The very first time anyone loads it, the app
   notices the shared tables are empty and seeds them automatically:
   ~530 starter parts, the manufacturer list, and the default pilot name.
   This only happens once and may take a minute or two — after that, the
   database is the live source of truth and every visit just reads it.

5. **Share the URL** with your team. No accounts, no invites — opening the
   link is all that's needed to read and add MPNs.

## What changed from the standalone version

Because there's now one shared live database instead of individual browser
copies, a few things work differently:

- **No more Export/Import/Publish cycle.** Adding an MPN, marking something
  Yes, or adding a manufacturer is saved immediately for everyone — there's
  nothing to hand off at end of day.
- **"Reload default data" → "Refresh from database."** A manual safety-net
  button that re-pulls the current shared state, in case the live
  connection hiccups. Normally you won't need it — updates arrive
  automatically.
- **"Load source .xlsx" → bulk-import.** Instead of replacing your local
  view, picking a workbook now adds those rows to the shared database for
  everyone (with a confirmation first, since it's a real, shared write).
- **"Start new pilot" is now genuinely destructive** — it deletes every
  part for the whole team, not just your local session. It still asks
  twice and asks for a new pilot name before doing anything.
- **"Export all data (.json backup)"** still exists as a simple point-in-time
  backup/export, since that's occasionally handy even with a live database.

## The trust model, worth repeating

Anyone with the deployed URL can read and write the shared data — the same
trust model as a public Google Doc link, by design (no login was the ask).
Two low-effort ways to keep that reasonable:

- The API key in `resource.ts` is set to expire (`expiresInDays: 90`).
  Redeploying rotates it — an old, leaked link quietly stops working
  rather than staying open forever.
- Don't publish the Amplify URL anywhere public or indexed; treat it like
  you would any shared-link document.

## Known limitations of this first pass

- This has been written against Amplify's documented Data client API
  (`create` / `update` / `delete` / `observeQuery`) but has **not been
  exercised against a live deployed backend** — there's no AWS access
  available to test this from where it was built. Treat the first real
  deploy as the first real test, and expect to iterate on rough edges.
- Bulk operations (first-time seeding, "start new pilot") run many
  individual API calls with limited concurrency rather than a true batch
  API — seeding ~530 rows or wiping a large dataset will take real time
  (likely well under a minute, but noticeable).
- `esm.sh` is used to load `aws-amplify` directly in the browser without a
  bundler, so the app can stay a single `index.html` file. This is a common,
  working pattern, but if you ever want a "proper" bundled build (Vite, etc.)
  instead, that's a reasonable follow-up rather than a requirement.
