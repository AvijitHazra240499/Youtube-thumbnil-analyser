// src/services/groqService.ts
import axios from 'axios';

// If VITE_GROQ_API_URL is set, use it. Otherwise, default to VITE_BACKEND_URL + '/ideas'
const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || (import.meta.env.VITE_BACKEND_URL + '/ideas');
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';


export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export async function generateVideoIdeas(videoTitle: string, videoDescription: string): Promise<VideoIdea[]> {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        title: videoTitle,
        description: videoDescription,
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Support {ideas:[...]}, {data:{ideas:[...]}} or direct array
    const ideas = response.data.ideas || response.data.data?.ideas || response.data;
    return Array.isArray(ideas) ? ideas : [];
  } catch (error: any) {
    // Log error for debugging
    if (error.response) {
      console.error('GROQ API error', error.response.status, error.response.data);
      throw new Error(`${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Failed to generate video ideas.'}`);
    } else {
      console.error('GROQ API error', error.message);
      throw new Error('Failed to generate video ideas.');
    }
  }
}
