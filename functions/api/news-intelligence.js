// Cloudflare Pages Function — News Intelligence Dashboard Data
// GET /api/news-intelligence?days=30
// Reads sentiment data from KV and returns structured JSON for the dashboard.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '30');

  const FEEDS = [
    { id: 'apf-topnews', name: 'Top News' },
    { id: 'apf-usnews', name: 'US News' },
    { id: 'apf-intlnews', name: 'International' },
    { id: 'apf-politics', name: 'Politics' },
    { id: 'apf-business', name: 'Business' },
    { id: 'apf-technology', name: 'Technology' },
    { id: 'apf-sports', name: 'Sports' },
    { id: 'apf-entertainment', name: 'Entertainment' },
    { id: 'apf-Health', name: 'Health' },
    { id: 'apf-science', name: 'Science' },
    { id: 'apf-oddities', name: 'Oddities' },
    { id: 'climate', name: 'Climate' },
  ];

  const today = new Date();
  const dailyData = [];
  const feedSummary = {};

  for (const feed of FEEDS) {
    feedSummary[feed.id] = { name: feed.name, positive: 0, negative: 0, total: 0, days: [] };
  }

  // Gather daily data for the last N days
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayEntry = { date: dateStr, feeds: {} };

    for (const feed of FEEDS) {
      const key = `sentiment-daily:${feed.id}:${dateStr}`;
      const data = await env.ANALYTICS_KV.get(key, 'json');
      if (data && data.total > 0) {
        dayEntry.feeds[feed.id] = {
          positive: data.positive,
          negative: data.negative,
          total: data.total,
        };
        feedSummary[feed.id].positive += data.positive;
        feedSummary[feed.id].negative += data.negative;
        feedSummary[feed.id].total += data.total;
        feedSummary[feed.id].days.push(dateStr);
      }
    }

    if (Object.keys(dayEntry.feeds).length > 0) {
      dailyData.push(dayEntry);
    }
  }

  // Reverse to chronological order
  dailyData.reverse();

  // Build feed summaries sorted by total volume
  const feedSummaries = Object.values(feedSummary)
    .filter(f => f.total > 0)
    .map(f => ({
      name: f.name,
      positive: f.positive,
      negative: f.negative,
      total: f.total,
      positivePct: f.total > 0 ? Math.round(f.positive / f.total * 100) : 0,
      negativePct: f.total > 0 ? Math.round(f.negative / f.total * 100) : 0,
      daysActive: f.days.length,
    }))
    .sort((a, b) => b.total - a.total);

  // Find most positive and most negative days
  let mostPositiveDay = null, mostNegativeDay = null;
  for (const day of dailyData) {
    let dayPos = 0, dayNeg = 0, dayTotal = 0;
    for (const feedId in day.feeds) {
      dayPos += day.feeds[feedId].positive;
      dayNeg += day.feeds[feedId].negative;
      dayTotal += day.feeds[feedId].total;
    }
    if (dayTotal > 0) {
      const posPct = dayPos / dayTotal;
      const negPct = dayNeg / dayTotal;
      if (!mostPositiveDay || posPct > mostPositiveDay.posPct) {
        mostPositiveDay = { date: day.date, posPct, total: dayTotal };
      }
      if (!mostNegativeDay || negPct > mostNegativeDay.negPct) {
        mostNegativeDay = { date: day.date, negPct, total: dayTotal };
      }
    }
  }

  // Get today's stories with sentiment for the "latest" section
  const todayStr = today.toISOString().split('T')[0];
  const latestStories = [];
  for (const feed of FEEDS.slice(0, 5)) {
    const key = `sentiment-stories:${feed.id}:${todayStr}`;
    const data = await env.ANALYTICS_KV.get(key, 'json');
    if (data && data.stories) {
      for (const story of data.stories.slice(0, 3)) {
        latestStories.push({ ...story, feed: feed.name });
      }
    }
  }

  return new Response(JSON.stringify({
    queriedAt: new Date().toISOString(),
    daysRequested: days,
    daysWithData: dailyData.length,
    feedSummaries,
    dailyData,
    highlights: {
      mostPositiveDay,
      mostNegativeDay,
    },
    latestStories: latestStories.slice(0, 10),
    totalStoriesAnalyzed: feedSummaries.reduce((sum, f) => sum + f.total, 0),
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}