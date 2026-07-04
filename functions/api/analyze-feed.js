// Cloudflare Pages Function — Analyze AP News Feed Sentiment
// GET /api/analyze-feed?feed=apf-politics  (analyze one feed)
// GET /api/analyze-feed?all=true           (analyze all feeds)
// Stores per-story sentiment in KV: sentiment:{feed}:{date}
// Stores daily aggregation in KV: sentiment-daily:{feed}:{YYYY-MM-DD}

const FEEDS = [
  'apf-topnews', 'apf-usnews', 'apf-intlnews', 'apf-politics',
  'apf-business', 'apf-technology', 'apf-sports', 'apf-entertainment',
  'apf-Health', 'apf-science', 'apf-oddities', 'climate'
];

const RSS_BASE = 'https://aaronrdavis.news/api/rss';
const SENTIMENT_MODEL = '@cf/huggingface/distilbert-sst-2-int8';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const feedParam = url.searchParams.get('feed');
  const allMode = url.searchParams.get('all') === 'true';
  const feeds = allMode ? FEEDS : (feedParam ? [feedParam] : ['apf-topnews']);

  const results = [];

  for (const feed of feeds) {
    try {
      // Fetch the feed via our own RSS endpoint
      const feedRes = await fetch(`${RSS_BASE}?feed=${feed}`, { signal: AbortSignal.timeout(15000) });
      if (!feedRes.ok) {
        results.push({ feed, error: `RSS HTTP ${feedRes.status}`, analyzed: 0 });
        continue;
      }
      const feedData = await feedRes.json();
      const items = (feedData.items || []).slice(0, 20); // Max 20 per feed

      let positive = 0, negative = 0, total = 0;
      const stories = [];

      for (const item of items) {
        try {
          const text = `${item.title}. ${item.description || ''}`.trim().substring(0, 500);
          const aiResult = await env.AI.run(SENTIMENT_MODEL, { text });

          let label = 'neutral';
          let posScore = 0, negScore = 0;

          if (aiResult) {
            if (aiResult.response && Array.isArray(aiResult.response)) {
              for (const s of aiResult.response) {
                if (s.label === 'POSITIVE') posScore = s.score;
                if (s.label === 'NEGATIVE') negScore = s.score;
              }
            } else if (aiResult.label) {
              if (aiResult.label === 'POSITIVE') posScore = aiResult.score;
              if (aiResult.label === 'NEGATIVE') negScore = aiResult.score;
            }
          }

          label = posScore > negScore ? 'positive' : 'negative';
          if (posScore > 0.6) positive++;
          else if (negScore > 0.6) negative++;
          total++;

          stories.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            sentiment: label,
            positive: parseFloat(posScore.toFixed(3)),
            negative: parseFloat(negScore.toFixed(3)),
          });
        } catch (err) {
          // Skip individual story failures
        }
      }

      // Store in KV
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `sentiment-daily:${feed}:${today}`;
      const dailyData = { feed, date: today, positive, negative, total, analyzedAt: new Date().toISOString() };
      await env.ANALYTICS_KV.put(dailyKey, JSON.stringify(dailyData), { expirationTtl: 86400 * 30 }); // 30 day TTL

      // Store top stories with sentiment
      const storiesKey = `sentiment-stories:${feed}:${today}`;
      await env.ANALYTICS_KV.put(storiesKey, JSON.stringify({ feed, date: today, stories: stories.slice(0, 10) }), { expirationTtl: 86400 * 7 }); // 7 day TTL

      results.push({ feed, analyzed: total, positive, negative, neutral: total - positive - negative });
    } catch (err) {
      results.push({ feed, error: err.message, analyzed: 0 });
    }
  }

  return new Response(JSON.stringify({
    analyzedAt: new Date().toISOString(),
    feedsProcessed: results.length,
    results,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}