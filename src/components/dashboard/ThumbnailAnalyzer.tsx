import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, MessageSquare, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTrial } from "@/contexts/TrialContext";

export function ThumbnailAnalyzer() {
  const { isPro, daysLeft, expired, loading: trialLoading } = useTrial();
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file.');
    } finally {
      setUploading(false);
    }
  };



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
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
      // 1. Upload image to Supabase Storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      const userId = user?.id || null;
      if (!userId) {
        setError('You must be logged in to use this feature.');
        setLoading(false);
        return;
      }
      const filePath = `thumbnails/${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('thumbnails').upload(filePath, file);
      if (uploadError) {
        setError('Failed to upload image: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('thumbnails').getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) {
        setError('Could not get public URL for uploaded image.');
        setLoading(false);
        return;
      }
      // 2. Call llama-api Edge Function
      const llamaRes = await fetch('/functions/v1/llama-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          feature: 'thumbnail-analyzer',
          prompt: queryText,
          imageUrl,
        }),
      });
      const llamaData = await llamaRes.json();
      if (!llamaRes.ok) {
        throw new Error(llamaData.error || 'Llama API error');
      }
      setLlamaResponse(llamaData.result || 'No response from Llama API.');
      setLlavaResponse(''); // Clear old Llava response
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while processing the request.');
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center mb-12">
        <Camera className="text-6xl text-gray-400 mr-4" />
        <h1 className="text-4xl font-bold text-purple-300 shadow-md">AI-DOCTOR (MEDICAL CHATBOT) ANALYZE IMAGE APPLICATION</h1>
      </div>
      {!isPro && !expired && (
        <div className="flex justify-center mb-6">
          <div className="bg-blue-900 text-blue-200 px-4 py-2 rounded-lg text-sm font-semibold">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left in your free trial.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-400">Upload Image</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md cursor-pointer transition-all ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (!uploading) fileInputRef.current?.click();
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                  <p className="mt-2 text-sm text-gray-400">
                    Choose a file from your computer
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 50MB
                </p>
              </div>
            </div>

            {previewUrl && (
              <div className="mt-4">
                <img
                  src={previewUrl}
                  alt="Uploaded image"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-400">Ask Question</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your question about the image"
              className="w-full"
            />
            <Button
              onClick={handleSubmit}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-400">Llama-3.2-11b-vision Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-800 p-4 rounded text-gray-300">
              {llamaResponse}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-400">Llama-3.2-90b-vision Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-800 p-4 rounded text-gray-300">
              {llavaResponse}
            </div>
          </CardContent>
        </Card>
      </div>

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
