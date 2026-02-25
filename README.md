# Olio RSS Feed Server

A simple Node.js server that converts the Viewcy API into a valid RSS 2.0 feed that MailerLite (and any RSS reader) can consume.

## What it does

- Fetches live course/event data from `https://www.viewcy.com/api/v1/schools/olio/courses`
- Converts it into a standard RSS 2.0 XML feed at `/rss`
- Each event becomes an RSS item with title, date, price, description, and image
- Caches for 1 hour to avoid hammering the API

---

## Deploy to Vercel (Free — recommended)

1. **Install Vercel CLI** (if you haven't):
   ```bash
   npm i -g vercel
   ```

2. **Clone/download this project**, then from the project folder:
   ```bash
   npm install
   vercel
   ```

3. Follow the prompts. Vercel will give you a URL like:
   `https://olio-rss-feed.vercel.app`

4. **Update `vercel.json`** — set `FEED_URL` to your actual Vercel URL:
   ```json
   "FEED_URL": "https://olio-rss-feed.vercel.app/rss"
   ```
   Then redeploy: `vercel --prod`

5. Your RSS feed will be live at:
   `https://olio-rss-feed.vercel.app/rss`

---

## Alternative: Deploy to Render (also free)

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your repo
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Environment variable:** `FEED_URL` = `https://your-app.onrender.com/rss`

---

## Connect to MailerLite

1. In MailerLite, go to **Campaigns → Create Campaign → RSS Campaign**
2. For the RSS Feed URL, enter your deployed URL:
   `https://your-app.vercel.app/rss`
3. Set the **send frequency** to weekly (e.g., every Monday morning)
4. MailerLite will automatically pull new events each week and send them to your subscribers

### MailerLite RSS Merge Tags you can use in your email template:
- `{$rss_item_title}` — Event name
- `{$rss_item_description}` — Date, price, and event description
- `{$rss_item_url}` — Booking link
- `{$rss_item_image_url}` — Event image (from `<enclosure>` tag)

---

## Local development

```bash
npm install
node server.js
```

Then open: `http://localhost:3000/rss`

---

## Notes

- The feed auto-updates every time MailerLite fetches it (the server always pulls fresh data from Viewcy)
- The 1-hour cache (`Cache-Control: max-age=3600`) prevents redundant API calls
- If Viewcy adds new events, they'll appear automatically in the next RSS email
