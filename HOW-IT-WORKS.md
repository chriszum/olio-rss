# How the Olio RSS Feed Works

## The Big Picture

MailerLite can send emails automatically based on an RSS feed — but Think Olio's event platform (Viewcy) doesn't publish one. This project creates that missing RSS feed so MailerLite can pull upcoming events and send them as a weekly email.

---

## The Flow

```
Viewcy (event data) → Our server → RSS feed → MailerLite → Weekly email
```

1. **Viewcy** stores all Think Olio events and exposes them via a private API URL.
2. **Our server** fetches that data, formats it, and converts it into an RSS feed.
3. **MailerLite** reads the RSS feed URL and uses the events to populate the weekly email.

---

## What the Server Does

Every time MailerLite requests the feed URL, the server:

1. Calls the Viewcy API to get the latest list of upcoming events
2. Sorts them soonest-first
3. Formats each event into an RSS "item" with:
   - **Title** — the event name
   - **Link** — the booking URL
   - **Author** — the date and time in plain English (e.g. *Tuesday, Mar 4 · 7:00 PM*)
   - **Description** — the event description and tags
   - **Image** — the event's featured photo
4. Returns the whole thing as an RSS feed that MailerLite can read

---

## The URLs

| What | URL |
|---|---|
| Live feed (use this in MailerLite) | `https://olio-rss.vercel.app/v2` |
| Health check | `https://olio-rss.vercel.app` |
| GitHub code | `https://github.com/chriszum/olio-rss` |
| Vercel dashboard | `https://vercel.com/chriszums-projects/olio-rss` |

---

## Where It Lives

- **The code** is stored on GitHub at `chriszum/olio-rss`
- **The server** runs on Vercel (free hosting that runs Node.js code in the cloud)
- Vercel wakes the server up on each request — there's nothing running 24/7

---

## How to Make Changes

Any code changes follow this process:

1. Edit the code (e.g. change date format, add a field)
2. Push to GitHub
3. Run `npx vercel --prod` to deploy the new version
4. The live URL updates instantly

If MailerLite seems to be showing stale data, the feed URL can be changed to a new path (e.g. `/v2`, `/v3`) to force a fresh fetch — all paths serve the same feed.

---

## If Something Breaks

- Check the live feed URL in a browser — it should show raw XML with event titles
- Check the Vercel dashboard for deployment errors or logs
- The Viewcy API URL is hardcoded in `server.js` — if Viewcy changes their API, that line will need updating
