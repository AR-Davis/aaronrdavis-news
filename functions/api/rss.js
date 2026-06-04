// Cloudflare Pages Function - Scrapes AP News
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const feedName = url.searchParams.get('feed') || 'topnews';
    
    const feedMap = {
        'apf-topnews': 'https://apnews.com/apf-topnews',
        'apf-usnews': 'https://apnews.com/apf-usnews', 
        'apf-intlnews': 'https://apnews.com/apf-intlnews',
        'apf-politics': 'https://apnews.com/apf-politics',
        'apf-business': 'https://apnews.com/apf-business',
        'apf-technology': 'https://apnews.com/apf-technology',
        'apf-sports': 'https://apnews.com/apf-sports',
        'apf-entertainment': 'https://apnews.com/apf-entertainment',
        'apf-Health': 'https://apnews.com/apf-Health',
        'apf-science': 'https://apnews.com/apf-science',
        'apf-oddities': 'https://apnews.com/apf-oddities'
    };
    
    const apUrl = feedMap[feedName];
    if (!apUrl) {
        return new Response(JSON.stringify({ error: 'Invalid feed' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    try {
        const response = await fetch(apUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const html = await response.text();
        const items = parseAP(html);
        
        return new Response(JSON.stringify({
            feed: feedName,
            items: items,
            count: items.length,
            fetchedAt: new Date().toISOString()
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}

function parseAP(html) {
    const items = [];
    const seen = new Set();
    
    // Pattern: <a class="Link" aria-label="HEADLINE" href="https://apnews.com/article/SLUG">
    const ariaPattern = /<a[^>]*class="Link[^"]*"[^>]*aria-label="([^"]+)"[^>]*href="https:\/\/apnews\.com\/article\/([^"]+)"[^>]*>/gi;
    let match;
    
    while ((match = ariaPattern.exec(html)) !== null) {
        const title = cleanText(match[1]);
        const url = 'https://apnews.com/article/' + match[2].trim();
        
        if (title && title.length > 10 && !seen.has(url)) {
            seen.add(url);
            items.push({ title, link: url, description: '', pubDate: new Date().toISOString() });
        }
        if (items.length >= 20) break;
    }
    
    // Fallback: <a class="Link" href="..."><span class="PagePromoContentIcons-text">HEADLINE</span></a>
    if (items.length < 5) {
        const spanPattern = /<a[^>]*class="Link[^"]*"[^>]*href="https:\/\/apnews\.com\/article\/([^"]+)"[^>]*>[\s\S]*?<span class="PagePromoContentIcons-text">([^<]+)<\/span>/gi;
        while ((match = spanPattern.exec(html)) !== null) {
            const url = 'https://apnews.com/article/' + match[1].trim();
            const title = cleanText(match[2]);
            
            if (title && title.length > 10 && !seen.has(url)) {
                seen.add(url);
                items.push({ title, link: url, description: '', pubDate: new Date().toISOString() });
            }
            if (items.length >= 20) break;
        }
    }
    
    return items;
}

function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}
