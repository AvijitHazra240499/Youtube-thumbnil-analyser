import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, MessageSquare, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTrial } from "@/contexts/TrialContext";
import { motion } from "framer-motion"; // For 3D/animated card effects
import { ResultSlides } from "./ResultSlides";


export function ThumbnailAnalyzer() {
  const { isPro, daysLeft, expired, loading: trialLoading } = useTrial();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [llamaResponse, setLlamaResponse] = useState('');
  const [llavaResponse, setLlavaResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // For image upload button
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only one handleFileChange, uses fileInputRef
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('handleFileChange called. File:', file);
    if (!file) {
      setError('No file selected.');
      return;
    }
    setUploading(true);
    try {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file.');
    } finally {
      setUploading(false);
    }
  };



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = selectedFile;
    const queryText = query.trim();

    if (!file || !queryText) {
      setError('Please upload an image and enter a query.');
      return;
    }

    setLoading(true);
    setError('');
    setLlamaResponse('');
    setLlavaResponse('');

    try {
      setError(null);
      // Send image and query to FastAPI backend as form-data
      const formData = new FormData();
      formData.append('image', file);      formData.append('query', queryText);
      const response = await fetch('http://127.0.0.1:8000/upload_and_query', {
        method: 'POST',
        body: formData,
      });
      const text = await response.text();
      if (!text) {
        setError('Empty response from server');
        setLoading(false);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        setError('Invalid JSON response from server');
        setLoading(false);
        return;
      }
      if (data.heading && data.description) {
        setLlamaResponse(JSON.stringify({ heading: data.heading, description: data.description, hashtags: data.hashtags || '' }));
      } else {
        setLlamaResponse(data.llama || '');
        setLlavaResponse(data.llava || '');
      }
      if (data.error) setError(data.error);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  }

  if (trialLoading) return null;

  if (expired && !isPro) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-lg mx-auto mt-10">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <span className="text-lg font-bold">Your 5-day free trial has ended.</span>
            <br />
            Please upgrade to Pro to continue using all features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 animate-gradient bg-gradient-to-tr from-[#1e3c72] via-[#2a5298] to-[#6dd5ed] bg-[length:400%_400%]" style={{filter: 'blur(2px)', opacity: 0.8}} />
      {/* Page Header */}
      <div className="w-full max-w-5xl mx-auto mb-8 mt-2">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#00F0FF] drop-shadow mb-2 tracking-tight text-center">
          Thumbnail Analyzer
        </h2>
        <p className="text-center text-gray-300 mb-2 max-w-2xl mx-auto text-lg">
          Upload your thumbnail to analyze trends and get performance insights.
        </p>
        <div className="w-24 h-1 mx-auto bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] rounded-full mb-2" />
      </div>
      <div className="flex flex-col md:flex-row items-start justify-center w-full max-w-6xl mx-auto gap-10 mb-12 px-2 md:px-0">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-2xl min-h-[320px] h-auto flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg transition-all duration-300 p-0 md:p-2">
            {!previewUrl ? (
              <div className="flex flex-col items-center justify-center w-full h-full py-12">
                <Upload className="w-20 h-20 text-purple-300 mb-6" />
                <button
                  type="button"
                  className={`inline-flex items-center justify-center px-8 py-4 bg-gradient-to-tr from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg cursor-pointer transition-all duration-200 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (!uploading) fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                  tabIndex={0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>Select Image</>
                  )}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <p className="mt-6 text-base text-gray-400">PNG, JPG, GIF up to 50MB</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center py-6 transition-all duration-300">
                <img
                  src={previewUrl}
                  alt="Uploaded image"
                  className="w-full max-w-2xl max-h-[60vh] object-contain rounded-2xl shadow-xl border border-gray-200 bg-white transition-all duration-300"
                  style={{ aspectRatio: '16/9' }}
                />
                <button
                  type="button"
                  className="mt-6 px-5 py-2 text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); fileInputRef.current!.value = ''; }}
                >Change Image</button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center w-full max-w-md mt-8 md:mt-0">
          <Card className="w-full bg-white/90 shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-blue-500 text-2xl font-semibold text-center">Ask Question</CardTitle>
            </CardHeader>
            <CardContent>
  <form onSubmit={handleSubmit}>
    <Textarea
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Enter your question about the image"
      className="w-full"
    />
    <Button
      type="submit"
      disabled={loading}
      className="w-full mt-4"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Submit Query
        </>
      )}
    </Button>
  </form>
</CardContent>
          </Card>
        </div>
      </div>
    {/* Modern Animated Slides Output */}
    {(llamaResponse || llavaResponse) && (() => {
        let heading = "";
        let description = "";
        let hashtags = "";
        // Robust mapping from Groq backend
        try {
          const json = JSON.parse(llamaResponse);
          if (json.heading && json.description) {
            heading = json.heading;
            description = json.description;
            hashtags = json.hashtags || '';
          } else {
            throw new Error('Not JSON');
          }
        } catch {
          if (llamaResponse) {
            const parts = llamaResponse.split(/\n\n|\n|\r\n|\|\|\|/).map(s => s.trim()).filter(Boolean);
            if (parts.length >= 3) {
              [heading, description, hashtags] = parts;
            } else if (parts.length >= 2) {
              heading = parts[0];
              description = parts[1];
              hashtags = '';
            } else if (parts.length === 1) {
              heading = parts[0];
              description = '';
              hashtags = '';
            }
          }
        }
        // Clean description: remove bold markdown and convert * bullets to •
        const formattedDescription = description
          .replace(/\*\*([^*]+)\*\*/g, '$1')    // remove bold markdown
          .replace(/^\*\s+/gm, '• ')            // bullets at line start
          .replace(/\n\*\s+/g, '\n• ');        // bullets after newline
        // Prepare slides
        const slides = [
          { title: "Heading", content: heading, color: "text-blue-400" },
          { title: "Description", content: formattedDescription, color: "text-purple-400" },
          { title: "Hashtags", content: hashtags, color: "text-teal-400" },
        ];
        return <div className="w-full flex justify-center mt-12 animate-fadein">
          <ResultSlides slides={slides} />
        </div>;
      })()}


      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default ThumbnailAnalyzer;
