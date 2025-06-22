export interface VideoBase {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channel: string;
  views: string;
  likes: string;
  comments: string;
  tags: string[];
}

export interface TrendingVideo extends Omit<VideoBase, 'tags'> {
  /** YouTube video URL */
  url: string;
  channelImage?: string;
  duration?: string;
  category?: string;
  tags?: string[];
}

export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  reason?: string;
  createdAt?: string;
}
