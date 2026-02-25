const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const VIEWCY_API = 'https://www.viewcy.com/api/v1/schools/olio/courses';

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(isoString) {
  return new Date(isoString).toUTCString();
}

function formatPrice(tickets) {
  if (!tickets || tickets.length === 0) return '';
  const prices = tickets
    .map(t => parseFloat(t.price))
    .filter(p => p > 0);
  if (prices.length === 0) return 'Free';
  const min = Math.min(...prices);
  return `From $${min.toFixed(2)}`;
}

async function fetchCourses() {
  const res = await fetch(VIEWCY_API);
  if (!res.ok) throw new Error(`Viewcy API error: ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

function buildRss(courses) {
  const now = new Date().toUTCString();
  const nowMs = Date.now();

  // Sort soonest first, then assign descending fake pubDates so MailerLite
  // (which sorts descending) displays them in soonest-first order.
  const sorted = [...courses].sort((a, b) => {
    const aDate = a.events?.[0]?.starts_at ? new Date(a.events[0].starts_at) : new Date(0);
    const bDate = b.events?.[0]?.starts_at ? new Date(b.events[0].starts_at) : new Date(0);
    return aDate - bDate;
  });

  const items = sorted.map((course, index) => {
    const event = course.events && course.events[0];
    const pubDate = new Date(nowMs - index * 60000).toUTCString();
    const bookUrl = event ? event.book_url : course.url;
    const tags = (course.tags || []).map(t => t.name).join(', ');
    const description = stripHtml(course.description || '');
    const shortDesc = description.length > 500 ? description.slice(0, 497) + '...' : description;

    const tz = course.timezone || 'America/New_York';
    const eventDate = event ? (() => {
      const d = new Date(event.starts_at);
      const datePart = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz });
      return `${datePart} · ${timePart}`;
    })() : '';

    const fullDescription = [
      shortDesc,
      '',
      tags ? `Tags: ${tags}` : '',
    ].filter(Boolean).join('\n');

    return `    <item>
      <title>${escapeXml(course.name)}</title>
      <link>${escapeXml(bookUrl || course.url)}</link>
      <guid isPermaLink="true">${escapeXml(course.url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(eventDate)}</author>
      <description>${escapeXml(fullDescription)}</description>
      ${course.featured_image ? `<enclosure url="${escapeXml(course.featured_image)}" type="image/jpeg" length="0"/>` : ''}
      ${course.featured_image ? `<media:content url="${escapeXml(course.featured_image)}" medium="image"/>` : ''}
      ${tags ? tags.split(', ').map(t => `<category>${escapeXml(t)}</category>`).join('\n      ') : ''}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Think Olio – Upcoming Events</title>
    <link>https://www.viewcy.com/school/olio</link>
    <description>Upcoming events from Think Olio – interactive and intimate social learning events in NYC.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${process.env.FEED_URL || 'https://your-app.com/rss'}" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://www.viewcy.com/assets/olio-logo.png</url>
      <title>Think Olio</title>
      <link>https://www.viewcy.com/school/olio</link>
    </image>
${items.join('\n')}
  </channel>
</rss>`;
}

app.get(['/rss', '/weekly'], async (req, res) => {
  try {
    const courses = await fetchCourses();
    const xml = buildRss(courses);
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1 hour
    res.send(xml);
  } catch (err) {
    console.error('RSS generation error:', err);
    res.status(500).send('Error generating RSS feed');
  }
});

// Health check
app.get('/', (req, res) => {
  res.send(`
    <h1>Olio RSS Feed</h1>
    <p>RSS feed available at: <a href="/rss">/rss</a></p>
    <p>Add <code>/rss</code> to your MailerLite RSS campaign URL.</p>
  `);
});

app.listen(PORT, () => {
  console.log(`RSS server running on port ${PORT}`);
  console.log(`Feed available at: http://localhost:${PORT}/rss`);
});
