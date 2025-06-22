import type { VideoIdea as VIType, TrendingVideo as TVType } from '@/types/video';

// Re-export types with new names to avoid conflicts
export type VideoIdea = VIType;
export type TrendingVideo = TVType;

// YouTube Data API configuration
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Debug log the environment
console.log('Environment Variables:', import.meta.env);
console.log('YouTube API Key:', YOUTUBE_API_KEY ? 'Loaded' : 'Not loaded');

if (!YOUTUBE_API_KEY) {
  console.error('YouTube API key is not set. Please check your .env file.');
  console.error('Make sure your .env file is in the root directory and contains VITE_YOUTUBE_API_KEY');
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

if (!OPENROUTER_API_KEY) {
  console.error('OpenRouter API key is not set. Please check your .env file.');
}

// Helper function to generate a unique ID
const generateId = (prefix: string = '') => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// Helper function to fetch videos from YouTube Data API
const searchYouTubeVideos = async (query: string, maxResults: number = 10): Promise<any[]> => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not set');
      return [];
    }

    const url = `${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;
    console.log('YouTube API Request URL:', url);
    
    const response = await fetch(url);
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      throw new Error(`YouTube API error: ${response.status} - ${response.statusText}`);
    }
    
    return responseData.items || [];
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
};

// Helper function to get video details
const getVideoDetails = async (videoIds: string[]): Promise<any[]> => {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not set');
      return [];
    }

    if (videoIds.length === 0) {
      console.warn('No video IDs provided to getVideoDetails');
      return [];
    }

    const url = `${YOUTUBE_API_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
    console.log('YouTube API Video Details Request:', url);
    
    const response = await fetch(url);
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API Error Response (Details):', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        videoIds: videoIds
      });
      throw new Error(`YouTube API error (${response.status}): ${response.statusText}`);
    }
    
    return responseData.items || [];
  } catch (error) {
    console.error('Error fetching video details:', error);
    return [];
  }
};

// Format view count to be more readable (e.g., 1.2M, 3.4K)
const formatViewCount = (views: string | number): string => {
  // Convert to number if it's a string
  const num = typeof views === 'string' ? parseInt(views.replace(/[^0-9]/g, '')) : views;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Helper function to create a VideoIdea with required fields
const createVideoIdea = (idea: Omit<VideoIdea, 'id'>): VideoIdea => ({
  ...idea,
  id: generateId('idea'),
  createdAt: new Date().toISOString()
});

// Helper function to create a TrendingVideo with required fields
const createTrendingVideo = (video: Omit<TrendingVideo, 'id'> & { id?: string }): TrendingVideo => {
  const videoId = video.id || generateId('video');
  return {
    ...video,
    id: videoId,
    url: video.url || `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: video.publishedAt || 'Recently',
    thumbnail: video.thumbnail || `https://via.placeholder.com/320x180/1a1a1a/ffffff?text=${encodeURIComponent(video.title || 'Video')}`,
    duration: video.duration || '5:00',
    likes: video.likes || '0',
    comments: video.comments || '0',
    views: video.views || '0',
    channel: video.channel || 'Unknown Channel',
    description: video.description || '',
    tags: video.tags || [],
    title: video.title || 'Untitled Video'
  };
};

export const getVideoIdeas = async (keyword: string): Promise<VideoIdea[]> => {
  try {
    console.log('Fetching video ideas for keyword:', keyword);
    
    // First, search for videos based on the keyword
    const searchResults = await searchYouTubeVideos(keyword, 5);
    
    if (searchResults.length === 0) {
      console.warn('No videos found for keyword:', keyword);
      return [];
    }
    
    // Get video IDs from search results
    const videoIds = searchResults.map((item: any) => item.id.videoId).filter(Boolean);
    
    if (videoIds.length === 0) {
      console.warn('No valid video IDs found in search results');
      return [];
    }
    
    // Get detailed information for each video
    const videoDetails = await getVideoDetails(videoIds);
    
    if (videoDetails.length === 0) {
      console.warn('No video details found');
      return [];
    }
    
    // Transform video details into VideoIdea format
    const ideas: VideoIdea[] = videoDetails.map((video: any) => {
      const snippet = video.snippet;
      const stats = video.statistics;
      const contentDetails = video.contentDetails;
      
      // Generate tags based on video title and description
      const tags = [
        ...(snippet.tags?.slice(0, 5) || []), // Use video's own tags if available
        ...keyword.split(' ').filter((word: string) => word.length > 3), // Add keyword parts as tags
        snippet.channelTitle // Add channel name as a tag
      ].filter(Boolean).slice(0, 7); // Limit to 7 tags max
      
      return {
        id: video.id,
        title: snippet.title,
        description: snippet.description.substring(0, 200) + (snippet.description.length > 200 ? '...' : ''),
        tags: [...new Set(tags)].slice(0, 7), // Remove duplicates and limit to 7 tags
        reason: `Popular video with ${formatViewCount(stats?.viewCount || '0')} views`,
        createdAt: new Date(snippet.publishedAt).toISOString(),
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || ''
      };
    });
    
    return ideas;
  } catch (error) {
    console.error('Error in getVideoIdeas:', error);
    return [];
  }
};

// Generate default video ideas when API calls fail
const getDefaultVideoIdeas = (keyword: string): VideoIdea[] => {
  const baseIdeas = [
    {
      title: `10 Must-Know Facts About ${keyword} in 2024`,
      description: `Discover the top 10 most important things you need to know about ${keyword} this year. Stay ahead of the curve with these essential insights!`,
      tags: [keyword, 'facts', '2024', 'trending', 'top 10'],
      reason: 'Listicles perform well and are highly shareable'
    },
    {
      title: `How to Master ${keyword} - Complete Beginner's Guide`,
      description: `Learn everything you need to get started with ${keyword} in this comprehensive beginner's tutorial. Step-by-step instructions included!`,
      tags: [keyword, 'tutorial', 'beginner', 'how to', 'guide'],
      reason: 'Beginner guides have consistent search volume'
    },
    {
      title: `${keyword} vs. [Competitor] - Which One Should You Choose?`,
      description: `Detailed comparison between ${keyword} and its top competitor. We break down the pros, cons, and help you decide which one is right for you.`,
      tags: [keyword, 'comparison', 'review', 'versus', 'which is better'],
      reason: 'Comparison videos help with purchase decisions'
    },
    {
      title: `5 ${keyword} Hacks Experts Don't Want You to Know`,
      description: `Discover these 5 secret hacks that will take your ${keyword} skills to the next level. These expert tips will save you time and effort!`,
      tags: [keyword, 'hacks', 'tips', 'tricks', 'productivity'],
      reason: 'Hacks and tips are always popular'
    },
    {
      title: `The Future of ${keyword} - Predictions and Trends`,
      description: `Where is ${keyword} heading in the next 5 years? We analyze current trends and make predictions about the future of this industry.`,
      tags: [keyword, 'future', 'trends', 'prediction', 'analysis'],
      reason: 'Future predictions generate discussion and shares'
    },
    {
      title: `How I Made $10,000/Month With ${keyword} - Full Breakdown`,
      description: `Follow my journey of making $10,000/month with ${keyword}. I'll share exactly what worked, what didn't, and how you can replicate my success.`,
      tags: [keyword, 'income', 'success story', 'make money', 'case study'],
      reason: 'Income reports and success stories are highly engaging'
    },
    {
      title: `${keyword} - Complete Setup and Configuration Guide`,
      description: `Step-by-step tutorial on how to set up and configure ${keyword} for optimal performance. Perfect for beginners and advanced users alike.`,
      tags: [keyword, 'setup', 'tutorial', 'configuration', 'how to'],
      reason: 'Setup guides have consistent search volume'
    },
    {
      title: `The Dark Side of ${keyword} - What No One Tells You`,
      description: `Before you get started with ${keyword}, you need to know these hidden challenges and drawbacks that most people don't talk about.`,
      tags: [keyword, 'truth', 'honest review', 'problems', 'challenges'],
      reason: 'Controversial topics drive engagement'
    },
    {
      title: `${keyword} for Beginners - Common Mistakes to Avoid`,
      description: `Don't make these common ${keyword} mistakes that most beginners make! Learn from my experience and get it right the first time.`,
      tags: [keyword, 'mistakes', 'beginner', 'tips', 'avoid'],
      reason: 'Mistakes content helps viewers avoid pitfalls'
    },
    {
      title: `Interview With a ${keyword} Expert - Insider Secrets`,
      description: `Exclusive interview with a leading ${keyword} expert. Learn their best strategies, tips, and predictions for the future.`,
      tags: [keyword, 'interview', 'expert', 'tips', 'strategies'],
      reason: 'Expert interviews provide unique insights'
    }
  ];
  
  return baseIdeas.map(idea => createVideoIdea({
    ...idea,
    createdAt: new Date().toISOString(),
    reason: idea.reason || 'Handpicked based on current trends'
  }));
};

// Helper function to fetch real trending videos from YouTube API
const fetchYouTubeTrendingVideos = async (category: string = 'All'): Promise<TrendingVideo[]> => {
  try {
    console.log(`Fetching trending videos in category: ${category}`);
    
    // For YouTube Data API, we'll use the search endpoint with the most popular videos
    const response = await fetch(
      `${YOUTUBE_API_URL}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&maxResults=10®ionCode=US&key=${YOUTUBE_API_KEY}${category !== 'All' ? `&videoCategoryId=${getCategoryId(category)}` : ''}`
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('YouTube API Error:', errorData);
      throw new Error(`Failed to fetch trending videos: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || !data.items.length) {
      console.warn('No trending videos found in response');
      return [];
    }
    
    // Get video details for each video
    const videoIds = data.items.map((item: any) => item.id);
    const videoDetails = await getVideoDetails(videoIds);
    
    // Process and validate the video data
    return videoDetails.map((video: any) => {
      const snippet = video.snippet;
      const stats = video.statistics;
      const contentDetails = video.contentDetails;
      
      return createTrendingVideo({
        title: snippet.title,
        channel: snippet.channelTitle,
        views: formatViewCount(stats.viewCount || 0),
        description: snippet.description,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        tags: snippet.tags?.slice(0, 7) || [category.toLowerCase()],
        publishedAt: formatPublishedDate(snippet.publishedAt),
        duration: formatDuration(contentDetails.duration || 'PT0S'),
        likes: formatViewCount(stats.likeCount || 0),
        comments: formatViewCount(stats.commentCount || 0),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        id: video.id
      });
    });
    
  } catch (error) {
    console.error('Error in fetchYouTubeTrendingVideos:', error);
    // Fallback to default trending videos
    return [];
  }
};

// Helper function to map category names to YouTube category IDs
const getCategoryId = (category: string): string => {
  const categories: {[key: string]: string} = {
    'Film & Animation': '1',
    'Autos & Vehicles': '2',
    'Music': '10',
    'Pets & Animals': '15',
    'Sports': '17',
    'Travel & Events': '19',
    'Gaming': '20',
    'People & Blogs': '22',
    'Comedy': '23',
    'Entertainment': '24',
    'News & Politics': '25',
    'Howto & Style': '26',
    'Education': '27',
    'Science & Technology': '28',
    'Nonprofits & Activism': '29'
  };
  
  return categories[category] || '0'; // Default to 0 (All categories)
};

// Helper function to format duration from ISO 8601 to mm:ss
const formatDuration = (duration: string): string => {
  // If it's already in mm:ss format, return as is
  if (/^\d{1,2}:\d{2}$/.test(duration)) {
    return duration;
  }
  
  // Try to parse ISO 8601 duration
  const match = duration.match(/PT(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/);
  if (!match) return '0:00';
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to format published date to relative time (e.g., "3 days ago")
const formatPublishedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

// Fallback function in case the main API fails
const getFallbackTrendingVideos = (category: string): TrendingVideo[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
  // Base videos that are always included
  const baseVideos = [
    {
      title: `Top 10 Most Viewed Videos of ${currentYear} (${currentMonth} Update) | YouTube Trends`,
      channel: 'YouTube Trends',
      views: '7.5M',
      description: `The most viewed YouTube videos of ${currentYear} based on view count, engagement, and growth rate. Updated for ${currentMonth}.`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      tags: ['trending', 'most viewed', `${currentYear}`, 'viral', 'youtube trends'],
      publishedAt: '3 days ago',
      duration: '18:22',
      likes: '320K',
      comments: '15.8K',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      id: 'dQw4w9WgXcQ'
    },
    {
      title: `${currentMonth}'s Most Viral Videos - Top Trending Right Now!`,
      channel: 'Viral Now',
      views: '5.8M',
      description: `The most shared and talked-about videos of ${currentMonth} ${currentYear} that are breaking the internet!`,
      thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      tags: ['viral', 'trending now', `${currentMonth} ${currentYear}`, 'must watch'],
      publishedAt: '1 week ago',
      duration: '14:45',
      likes: '280K',
      comments: '12.3K',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      id: '9bZkp7q19f0'
    },
    {
      title: `Top 5 Fastest Growing YouTube Channels in ${currentYear}`,
      channel: 'Creator Insights',
      views: '3.2M',
      description: `These channels are growing faster than anyone else on YouTube in ${currentYear}. Find out who's leading the pack!`,
      thumbnail: 'https://i.ytimg.com/vi/1qN72LEQnaU/maxresdefault.jpg',
      tags: ['youtube growth', 'top channels', 'subscriber growth', 'trending', `${currentYear}`],
      publishedAt: '5 days ago',
      duration: '12:18',
      likes: '195K',
      comments: '8.7K',
      url: 'https://www.youtube.com/watch?v=1qN72LEQnaU',
      id: '1qN72LEQnaU'
    },
    {
      title: `Most Engaging Videos of ${currentMonth} - You Won't Believe #3!`,
      channel: 'Engage TV',
      views: '4.6M',
      description: `These videos have the highest engagement rates of ${currentMonth} ${currentYear}. The results might surprise you!`,
      thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      tags: ['engagement', 'viral', 'trending', 'youtube stats', 'most engaging'],
      publishedAt: '2 days ago',
      duration: '16:32',
      likes: '245K',
      comments: '14.2K',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      id: 'jNQXAC9IVRw'
    },
    {
      title: `Best YouTube Shorts of ${currentMonth} ${currentYear} (MOST VIEWED)`,
      channel: 'Shorts Daily',
      views: '9.1M',
      description: `The most viewed and shared YouTube Shorts of ${currentMonth} ${currentYear}. These short videos are taking over!`,
      thumbnail: 'https://i.ytimg.com/vi/2L2lnoxcIVQ/maxresdefault.jpg',
      tags: ['shorts', 'youtube shorts', 'viral', 'trending', 'most viewed'],
      publishedAt: '1 day ago',
      duration: '0:58',
      likes: '420K',
      comments: '22.7K',
      url: 'https://www.youtube.com/shorts/2L2lnoxcIVQ',
      id: '2L2lnoxcIVQ'
    },
    {
      title: `Top 10 Most Viewed Music Videos ${currentYear} (${currentMonth} Update)`,
      channel: 'Music Charts',
      views: '6.7M',
      description: `The most watched music videos on YouTube in ${currentYear}. See which songs are dominating the charts!`,
      thumbnail: 'https://i.ytimg.com/vi/BPgEgaPk62M/maxresdefault.jpg',
      tags: ['music videos', 'top songs', 'charts', 'trending', `${currentYear}`, 'most viewed'],
      publishedAt: '4 days ago',
      duration: '11:45',
      likes: '310K',
      comments: '18.3K',
      url: 'https://www.youtube.com/watch?v=BPgEgaPk62M',
      id: 'BPgEgaPk62M'
    },
    {
      title: `Most Viewed YouTube Videos in the Last 24 Hours (LIVE TRACKING)`,
      channel: 'Trend Tracker',
      views: '2.8M',
      description: `Live tracking of the most viewed YouTube videos in the last 24 hours. Updated in real-time!`,
      thumbnail: 'https://i.ytimg.com/vi/3tmd-ClpJxA/maxresdefault.jpg',
      tags: ['live', '24 hours', 'most viewed', 'trending now', 'real-time'],
      publishedAt: 'Just now',
      duration: '0:00',
      likes: '98K',
      comments: '7.5K',
      url: 'https://www.youtube.com/watch?v=3tmd-ClpJxA',
      id: '3tmd-ClpJxA'
    },
    {
      title: `Viral Challenges Taking Over ${currentMonth} ${currentYear} (DON'T TRY THESE!)`,
      channel: 'Challenge Central',
      views: '8.9M',
      description: `The most viral challenges taking over social media in ${currentMonth} ${currentYear}. Some of these are absolutely crazy!`,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      tags: ['challenges', 'viral', 'trending', 'dont try this', 'crazy'],
      publishedAt: '6 hours ago',
      duration: '13:22',
      likes: '410K',
      comments: '25.1K',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      id: 'dQw4w9WgXcQ2'
    },
    {
      title: `Top 10 Most Subscribed YouTube Channels in ${currentYear}`,
      channel: 'YouTube Analytics',
      views: '5.3M',
      description: `The most subscribed YouTube channels of ${currentYear}. See who's leading the platform this year!`,
      thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      tags: ['most subscribed', 'youtube channels', 'top creators', 'youtube stats', `${currentYear}`],
      publishedAt: '1 week ago',
      duration: '15:47',
      likes: '290K',
      comments: '14.8K',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
      id: '9bZkp7q19f02'
    },
    {
      title: `Most Viewed Video on the Internet (${currentMonth} ${currentYear} Update)`,
      channel: 'Internet Facts',
      views: '12.4M',
      description: `The most viewed video on the internet as of ${currentMonth} ${currentYear}. The numbers are mind-blowing!`,
      thumbnail: 'https://i.ytimg.com/vi/1qN72LEQnaU/maxresdefault.jpg',
      tags: ['most viewed', 'record breaking', 'viral', 'internet history', 'youtube records'],
      publishedAt: '3 days ago',
      duration: '9:52',
      likes: '380K',
      comments: '19.6K',
      url: 'https://www.youtube.com/watch?v=1qN72LEQnaU',
      id: '1qN72LEQnaU2'
    }
  ];

  // Filter by category if specified
  const filteredVideos = category === 'All' 
    ? baseVideos 
    : baseVideos.filter(video => 
        video.tags.some(tag => 
          typeof tag === 'string' && 
          tag.toLowerCase() === category.toLowerCase()
        )
      );

  // Ensure we return at least 10 videos
  const result = filteredVideos.length >= 10 
    ? filteredVideos.slice(0, 10)
    : [...filteredVideos, ...baseVideos].slice(0, 10);

  return result.map(video => createTrendingVideo(video));
};

export const getTrendingVideos = async (searchQuery: string = ''): Promise<TrendingVideo[]> => {
  try {
    console.log(`Getting trending videos for: ${searchQuery || 'general'}`);
    
    // If we have a search query, use the search functionality
    if (searchQuery && searchQuery.trim() !== '') {
      const searchResults = await searchYouTubeVideos(searchQuery, 10);
      
      if (searchResults.length === 0) {
        console.warn('No videos found for search query:', searchQuery);
        return [];
      }
      
      // Get video IDs from search results
      const videoIds = searchResults.map((item: any) => item.id.videoId).filter(Boolean);
      
      if (videoIds.length === 0) {
        console.warn('No valid video IDs found in search results');
        return [];
      }
      
      // Get detailed information for each video
      const videoDetails = await getVideoDetails(videoIds);
      
      // Transform video details into TrendingVideo format
      return videoDetails.map((video: any) => {
        const snippet = video.snippet;
        const stats = video.statistics;
        const contentDetails = video.contentDetails;
        
        return createTrendingVideo({
          title: snippet.title,
          channel: snippet.channelTitle,
          views: formatViewCount(stats?.viewCount || 0),
          description: snippet.description,
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
          tags: snippet.tags?.slice(0, 7) || [],
          publishedAt: formatPublishedDate(snippet.publishedAt),
          duration: formatDuration(contentDetails?.duration || 'PT0S'),
          likes: formatViewCount(stats?.likeCount || 0),
          comments: formatViewCount(stats?.commentCount || 0),
          url: `https://www.youtube.com/watch?v=${video.id}`,
          id: video.id
        });
      });
    }
    
    // If no search query, get trending videos
    const trendingVideos = await fetchYouTubeTrendingVideos('All');
    
    // If we have trending videos, return them
    if (trendingVideos && trendingVideos.length > 0) {
      return trendingVideos.slice(0, 10);
    }
    
    // Fallback to default trending videos if no results
    return [];
    
  } catch (error) {
    console.error('Error in getTrendingVideos:', error);
    // Return empty array in case of error (UI will handle empty state)
    return [];
  }
};

export const generateSimilarVideoIdeas = async (video: TrendingVideo): Promise<VideoIdea[]> => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a creative content strategist. Generate 3 video ideas similar to the given video.
            Each idea should include:
            - title: A catchy title
            - description: A brief description
            - tags: 3-5 relevant tags
            - reason: Why this would perform well
            `
          },
          {
            role: 'user',
            content: `Generate 3 video ideas similar to: ${video.title}\n\nDescription: ${video.description}\n\nTags: ${video.tags?.join(', ')}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 1500,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate video ideas');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    try {
      const parsedContent = JSON.parse(content);
      const ideas = Array.isArray(parsedContent) ? parsedContent : 
                  parsedContent.ideas || parsedContent.suggestions || [];
      
      return ideas.map((idea: any, index: number) => ({
        id: `idea-${index}-${Date.now()}`,
        title: idea.title || `Video Idea ${index + 1}`,
        description: idea.description || 'No description available',
        tags: Array.isArray(idea.tags) ? idea.tags : 
             (idea.tags ? idea.tags.split(',').map((t: string) => t.trim()) : ['trending', 'viral']),
        reason: idea.reason || 'This idea is likely to perform well based on current trends.'
      }));
    } catch (e) {
      console.error('Error parsing video ideas:', e);
      throw new Error('Could not parse video ideas');
    }
  } catch (error) {
    console.error('Error in generateSimilarVideoIdeas:', error);
    throw error;
  }
};

