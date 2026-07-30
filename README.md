# Vantage — Design

Design prototype for Vantage, a portfolio and market analysis app. Exported from Claude Design.

## Screens

| File | Screen |
| --- | --- |
| `Login.dc.html` | Sign in |
| `Onboarding.dc.html` | New user onboarding |
| `Overview.dc.html` | Dashboard / overview |
| `Portfolio Dispatch.dc.html` | Portfolio dispatch |
| `Holdings.dc.html` | Holdings list |
| `Performance.dc.html` | Performance charts |
| `Learn.dc.html` | Learn: courses, breakdowns, questionnaires, videos |
| `Plan.dc.html` | Planning |
| `Report.dc.html` | Reports |
| `Activity.dc.html` | Activity feed |
| `Market.dc.html` | Retired — redirects to Learn |
| `Profile.dc.html` | User profile |
| `Settings.dc.html` | Settings: risk, contributions, guardrails, database connection |
| `Feedback.dc.html` | Feedback form (saves via `VantageDB`) |

## Other files

- `support.js` — shared runtime/support script for the prototypes
- `atlas.js` — Atlas, the in-app guide: wires the "Ask Atlas" button on every page,
  runs a spotlight tour that explains each section of the current screen
  (hand-written scripts for Overview and Learn, auto-generated elsewhere), and
  offers the tour once to brand-new users: onboarding sets a one-shot
  `pd-atlas-tour-pending` flag that Atlas consumes on their first Overview visit
- `neon.js` — data layer for accounts & profiles (Neon Data API when connected, localStorage fallback otherwise)
- `schema.sql` — tables to create in Neon (`accounts`, `profiles`)
- `screenshots/` — reference screenshots of individual screens
- `uploads/` — logos and image assets

## Auth model

The deployed site is meant to sit behind **Netlify password protection** — that
is the actual lock on the door. The Login screen is a passwordless **profile
picker**: it lists existing profiles and lets you create a new one, which only
keeps each user's dashboard data separate.

## Connecting Neon

Profiles created on the Login screen and settings saved by Onboarding go through
`VantageDB` (`neon.js`). Until Neon is connected it stores everything in the
browser's localStorage, so the prototype works standalone.

To connect:

1. Run `schema.sql` against your Neon database.
2. Enable the **Data API** on the branch and copy its URL and key.
3. Either paste them into the `NEON` object at the top of `neon.js`, or run this
   once in the browser console on any Vantage page:

   ```js
   VantageDB.configure({ url: 'https://<your-endpoint>', apiKey: '<key>' })
   ```

Caveat: anyone past the Netlify password can open any profile and, if the Data
API key is in the client, read/write the tables. Fine for a private personal
dashboard shared with people you trust; use real per-user auth (e.g. Neon Auth)
if that ever changes.

## Viewing

Open any `.dc.html` file directly in a browser.
