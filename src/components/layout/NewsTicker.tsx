import { useState, useEffect, useRef } from 'react';
import { Rss } from 'lucide-react';

interface HeadlineItem {
  title: string;
  link: string;
}

// Fetches Fox News RSS headlines via a public CORS proxy
async function fetchHeadlines(): Promise<HeadlineItem[]> {
  const feeds = [
    'https://moxie.foxnews.com/google-publisher/latest.xml',
    'https://feeds.foxnews.com/foxnews/latest',
  ];

  for (const feedUrl of feeds) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const text = await res.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      // Try RSS <item> format
      let items = xml.querySelectorAll('item');
      if (items.length === 0) {
        // Try Atom <entry> format
        items = xml.querySelectorAll('entry');
      }

      const headlines: HeadlineItem[] = [];
      items.forEach((item, i) => {
        if (i >= 15) return;
        const title =
          item.querySelector('title')?.textContent?.trim() ?? '';
        const link =
          item.querySelector('link')?.textContent?.trim() ??
          item.querySelector('link')?.getAttribute('href') ??
          '';
        if (title) headlines.push({ title, link });
      });

      if (headlines.length > 0) return headlines;
    } catch {
      continue;
    }
  }

  // Fallback: return placeholder headlines
  return [
    { title: 'Breaking news headlines loading...', link: '' },
  ];
}

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState<HeadlineItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHeadlines().then(setHeadlines);
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchHeadlines().then(setHeadlines);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (headlines.length === 0) return null;

  // Double the headlines for seamless loop
  const tickerItems = [...headlines, ...headlines];

  return (
    <div
      className="flex items-center gap-2 overflow-hidden flex-1 mx-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Rss size={10} className="text-[#f43f5e]" />
        <span
          className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 text-[#f43f5e]"
        >
          Live
        </span>
      </div>

      <div className="overflow-hidden flex-1 relative" style={{ maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
        <div
          ref={tickerRef}
          className="flex items-center gap-6 whitespace-nowrap"
          style={{
            animation: `ticker ${tickerItems.length * 4}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-3 flex-shrink-0">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-white/50 hover:text-white/80 hover:underline transition-colors"
                >
                  {item.title}
                </a>
              ) : (
                <span
                  className="text-[10px] font-medium text-white/50"
                >
                  {item.title}
                </span>
              )}
              <span className="text-white/10">•</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
