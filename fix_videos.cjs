const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const [videos, setVideos] = useState<VideoClip[]>(INITIAL_VIDEOS);',
  `const [videos, setVideos] = useState<VideoClip[]>(() => {
    try {
      const stored = localStorage.getItem('smart_earning_videos');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_VIDEOS;
  });

  useEffect(() => {
    localStorage.setItem('smart_earning_videos', JSON.stringify(videos));
  }, [videos]);`
);

fs.writeFileSync('src/App.tsx', content);
