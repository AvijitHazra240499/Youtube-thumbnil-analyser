import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Lightbulb, Loader2, Search, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { searchYouTubeVideos, YouTubeVideo } from '@/services/youtubeService';
import { generateVideoIdeas, VideoIdea } from '@/services/groqService';

const VideoTrendsPage: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'ideas'>('trending');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    setVideos([]);
    setSelectedVideo(null);
    setIdeas([]);
    setActiveTab('trending');
    try {
      const results = await searchYouTubeVideos(searchQuery, 12);
      setVideos(results);
      if (results.length === 0) {
        toast({ title: 'No results', description: 'No trending videos found for your search.', variant: 'destructive' });
      }
    } catch (err: any) {
      setError('Failed to fetch trending videos.');
      toast({ title: 'Error', description: err.message || 'Failed to fetch trending videos.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateIdeas = async (video: YouTubeVideo) => {
    setIsLoadingIdeas(true);
    setIdeasError('');
    setIdeas([]);
    setSelectedVideo(video);
    setActiveTab('ideas');
    try {
      const result = await generateVideoIdeas(video.title, video.description);
      setIdeas(result);
      if (!result.length) {
        toast({ title: 'No ideas', description: 'No ideas were generated for this video.', variant: 'destructive' });
      }
    } catch (err: any) {
      setIdeasError('Failed to generate video ideas.');
      toast({ title: 'Error', description: err.message || 'Failed to generate video ideas.', variant: 'destructive' });
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-[#00F0FF]" /> Video Trends</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search trending YouTube videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>
        <Tabs value={activeTab} onValueChange={tab => setActiveTab(tab as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
            <TabsTrigger value="trending"><TrendingUp className="mr-2 h-4 w-4" />Trending</TabsTrigger>
            <TabsTrigger value="ideas" disabled={!selectedVideo}><Lightbulb className="mr-2 h-4 w-4" />Ideas</TabsTrigger>
          </TabsList>
          <TabsContent value="trending">
            {error && (
              <div className="flex items-center gap-2 text-red-500"><AlertTriangle />{error}</div>
            )}
            {isLoading && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-40 bg-gray-800" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 bg-gray-800 mb-2" />
                      <Skeleton className="h-4 w-1/2 bg-gray-800 mb-3" />
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Skeleton className="h-4 w-4 rounded-full bg-gray-800" />
                        <Skeleton className="h-4 w-24 bg-gray-800" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!isLoading && !error && videos.length === 0 && (
              <div className="text-center text-gray-400 mt-12">No trending videos found. Try a different search.</div>
            )}
            {!isLoading && !error && videos.length > 0 && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {videos.map(video => (
                  <Card key={video.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.open(video.url, '_blank')}>
                    <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-base line-clamp-2">{video.title}</span>
                        <Badge variant="secondary" className="ml-auto">{video.channel}</Badge>
                      </div>
                      <div className="text-gray-400 text-xs mb-2 line-clamp-2">{video.description}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
  <span>{video.views} views</span>
  <span>{video.subscriberCount} subs</span>
  <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
  {video.isCurrentYear && (
    <Badge variant="outline" className="ml-2 text-green-500 border-green-500">New {new Date(video.publishedAt).getFullYear()}</Badge>
  )}
</div>
                      <Button size="sm" variant="outline" className="mt-4 w-full" onClick={e => { e.stopPropagation(); handleGenerateIdeas(video); }}>
                        <Sparkles className="mr-2 h-4 w-4" />Get Ideas
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="ideas">
            {selectedVideo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-[#00F0FF]" />Ideas for: <span className="font-normal">{selectedVideo.title}</span></CardTitle>
                </CardHeader>
              </Card>
            )}
            {isLoadingIdeas && (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {ideasError && (
              <div className="flex items-center gap-2 text-red-500"><AlertTriangle />{ideasError}</div>
            )}
            {!isLoadingIdeas && !ideasError && ideas.length === 0 && (
              <div className="text-center text-gray-400 mt-12">No ideas generated yet for this video.</div>
            )}
            {!isLoadingIdeas && !ideasError && ideas.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {ideas.map((idea, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle>{idea.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-400 text-sm mb-2">{idea.description}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {idea.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoTrendsPage;
