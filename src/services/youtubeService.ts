// src/services/youtubeService.ts
import axios from 'axios';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channel: string;
  views: string;
  likes?: string;
  comments?: string;
  url: string;
  duration?: string;
  category?: string;
  tags?: string[];
  channelImage?: string;
  subscriberCount?: string;
  isCurrentYear?: boolean;
}

export async function searchYouTubeVideos(query: string, maxResults = 12): Promise<YouTubeVideo[]> {
  const response = await axios.get(`${BASE_URL}/search`, {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults,
      key: YOUTUBE_API_KEY,
    },
  });
  const items = response.data.items;
  const videoIds = items.map((item: any) => item.id.videoId).join(',');
  const detailsResp = await axios.get(`${BASE_URL}/videos`, {
    params: {
      part: 'snippet,statistics,contentDetails',
      id: videoIds,
      key: YOUTUBE_API_KEY,
    },
  });
  const detailsMap = new Map(detailsResp.data.items.map((v: any) => [v.id, v]));

  // Fetch channel info for subscriber count
  const channelIds = Array.from(new Set(items.map((item: any) => item.snippet.channelId)));
  let channelSubs: Record<string, string> = {};
  if (channelIds.length > 0) {
    const channelResp = await axios.get(`${BASE_URL}/channels`, {
      params: {
        part: 'statistics',
        id: channelIds.join(','),
        key: YOUTUBE_API_KEY,
      },
    });
    channelSubs = Object.fromEntries(
      channelResp.data.items.map((ch: any) => [ch.id, ch.statistics?.subscriberCount || ''])
    );
  }

  function formatNumber(num: string | number): string {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (isNaN(n)) return '';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  const currentYear = new Date().getFullYear();

  return items.map((item: any) => {
    const details: any = detailsMap.get(item.id.videoId);
    const publishedAt = item.snippet.publishedAt;
    const isCurrentYear = publishedAt && new Date(publishedAt).getFullYear() === currentYear;
    const channelId = item.snippet.channelId;
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || '',
      publishedAt,
      channel: item.snippet.channelTitle,
      views: formatNumber(details?.statistics?.viewCount || ''),
      likes: formatNumber(details?.statistics?.likeCount || ''),
      comments: formatNumber(details?.statistics?.commentCount || ''),
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      duration: details?.contentDetails?.duration,
      category: '',
      tags: details?.snippet?.tags || [],
      channelImage: '', // Optionally fetch with another API call
      subscriberCount: formatNumber(channelSubs[channelId] || ''),
      isCurrentYear,
    };
  });
}
