import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Twitter, Instagram, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResultSlides } from "./ResultSlides";

const TweetGenerator: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tweets, setTweets] = useState<string[]>([]);
  const [igs, setIgs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleGenerate = async () => {
    if (!file && !topic.trim()) {
      setError("Please upload an image or enter a topic.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // ---- Call backend API ----
      const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const formData = new FormData();
      if (file) formData.append("image", file);
      if (topic.trim()) formData.append("topic", topic.trim());

      const resp = await fetch(`${apiBase}/generate_tweet`, {
        method: "POST",
        body: formData
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Backend error ${resp.status}`);
      }

      const aiData = await resp.json();
      // aiData is expected to be {tweets: [...], igs: [...]}

      // Normalize tweets/igs arrays
      const tweetStrings = Array.isArray(aiData.tweets)
        ? aiData.tweets.map((t: any) => typeof t === "string" ? t : t.text ?? JSON.stringify(t))
        : [];
      const igStrings = Array.isArray(aiData.igs)
        ? aiData.igs.map((p: any) => typeof p === "string" ? p : p.caption ?? JSON.stringify(p))
        : [];

      setTweets(tweetStrings);
      setIgs(igStrings);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setTweets([]);
      setIgs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-10">
      <Card className="bg-white/90 shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-blue-500 text-2xl font-semibold text-center flex items-center gap-2">
            <Twitter className="inline-block text-blue-400" /> Tweet & IG Post Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 flex flex-col items-center w-full">
              {!previewUrl ? (
                <div className="flex flex-col items-center w-full py-4">
                  <Upload className="w-16 h-16 text-purple-300 mb-4" />
                  <button
                    type="button"
                    className="px-6 py-3 bg-gradient-to-tr from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg cursor-pointer transition-all duration-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <p className="mt-3 text-sm text-gray-400">PNG, JPG, GIF up to 50MB</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center py-2">
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="w-full max-w-md max-h-[40vh] object-contain rounded-xl border border-gray-200 bg-white shadow"
                  />
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    onClick={() => { setPreviewUrl(null); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >Change Image</button>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-4 w-full">
              <Textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Or enter a topic for tweet/post (optional if image provided)"
                className="w-full"
              />
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Twitter className="mr-2 h-4 w-4" /> Generate Tweet & IG Post</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render tweet and Instagram cards */}
      {(tweets.length > 0 || igs.length > 0) && (
        <div className="w-full flex flex-col items-center gap-8 mt-10 animate-fadein">
          {tweets.length > 0 && (
            <div className="w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400"><Twitter className="inline-block text-blue-400" /> Tweets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tweets.map((tweet, idx) => (
                  <div key={idx} className="bg-gradient-to-tr from-blue-50 to-blue-100 border border-blue-200 rounded-2xl shadow p-4 text-gray-900 text-base flex flex-col gap-2">
                    <span className="font-semibold text-blue-500">Tweet {idx+1}</span>
                    <span>{tweet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {igs.length > 0 && (
            <div className="w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-pink-500">
                <span className="inline-block bg-gradient-to-tr from-pink-500 via-purple-400 to-yellow-400 rounded-full p-1"><InstagramIcon /></span>
                Instagram Posts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {igs.map((ig, idx) => (
                  <div key={idx} className="bg-gradient-to-tr from-pink-100 via-purple-50 to-yellow-50 border border-pink-200 rounded-2xl shadow-lg p-4 text-gray-900 text-base flex flex-col gap-2">
                    <span className="font-semibold text-pink-500">Post {idx+1}</span>
                    <span>{ig}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Instagram SVG icon
function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="url(#ig-gradient)"/>
      <defs>
        <linearGradient id="ig-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fd5"/>
          <stop offset="0.5" stopColor="#ff543e"/>
          <stop offset="1" stopColor="#c837ab"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/>
      <circle cx="18" cy="6" r="1" fill="#fff"/>
    </svg>
  );
}

export default TweetGenerator;
