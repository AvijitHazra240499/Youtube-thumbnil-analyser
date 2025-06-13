import React, { useRef, useState, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Twitter, Instagram, Upload, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResultSlides } from "./ResultSlides";
import { Helmet } from "react-helmet";

const TweetGenerator: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tweets, setTweets] = useState<string[]>([]);
  const [igs, setIgs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const dropTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    if (dropTimeoutRef.current) {
      clearTimeout(dropTimeoutRef.current);
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDropping) {
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragging(false);
      }, 50);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (!file) {
      setIsDragging(false);
      return;
    }

    setIsDropping(true);
    
    const syntheticEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as React.ChangeEvent<HTMLInputElement>;

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    handleFileChange(syntheticEvent);
    
    dropTimeoutRef.current = setTimeout(() => {
      setIsDropping(false);
      setIsDragging(false);
    }, 200);
  };

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

  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white w-full h-full p-6">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/[0.1] via-transparent to-transparent animate-gradient blur-[100px] pointer-events-none" />
      
      {/* Drop Animation Overlay */}
      <AnimatePresence mode="wait">
        {isDropping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#00F0FF]/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.5 
              }}
              className="relative"
            >
              <div className="w-24 h-24 bg-[#00F0FF] rounded-full flex items-center justify-center shadow-lg">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeInOut",
                    repeat: Infinity
                  }}
                >
                  <Upload className="w-12 h-12 text-black" />
                </motion.div>
              </div>
              {/* Particle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [1, 0],
                    x: [0, Math.cos(i * Math.PI / 4) * 100],
                    y: [0, Math.sin(i * Math.PI / 4) * 100],
                    opacity: [1, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    ease: "easeOut",
                    delay: i * 0.05
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#00F0FF] rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10">
        {/* SEO Optimization */}
        <Helmet>
          <title>AI Tweet & Instagram Post Generator | Create Engaging Social Media Content</title>
          <meta name="description" content="Generate engaging tweets and Instagram posts with AI. Upload an image or enter a topic to create viral social media content!" />
        </Helmet>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Sparkles className="mr-2 text-[#00F0FF]" /> Social Media Content Generator
          </h2>
          <p className="text-gray-400">Create engaging tweets and Instagram posts with AI assistance</p>
        </motion.div>

        {/* Call-to-Action */}
        <div className="my-4 p-4 bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] rounded-lg shadow-lg flex flex-col items-center relative z-10">
          <span className="text-xl font-semibold text-black mb-2">Ready to create viral social media content?</span>
          <span className="text-lg text-white mb-2">Upload an image or enter a topic to get started!</span>
        </div>

        {/* Main Card */}
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#00F0FF] text-2xl font-semibold flex items-center gap-2">
              <Twitter className="text-[#00F0FF]" /> Tweet & Instagram Post Generator
            </CardTitle>
            <CardDescription className="text-gray-400">Generate engaging social media content with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Image Upload Section */}
              <div className="flex-1 flex flex-col items-center w-full">
                {!previewUrl ? (
                  <motion.div 
                    className={`flex flex-col items-center w-full py-8 px-4 rounded-xl border-2 border-dashed transition-all duration-300 relative overflow-hidden
                      ${isDragging 
                        ? 'bg-[#00F0FF]/10 border-[#00F0FF] scale-105' 
                        : 'bg-gray-800/50 border-gray-700 hover:border-[#00F0FF]/50'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <AnimatePresence mode="wait">
                      {isDragging && !isDropping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 bg-[#00F0FF]/10"
                        />
                      )}
                    </AnimatePresence>
                    <motion.div
                      animate={isDragging && !isDropping ? {
                        y: [0, -10, 0],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      } : {}}
                    >
                      <Upload className={`w-16 h-16 mb-4 transition-colors duration-300 ${isDragging ? 'text-[#00F0FF]' : 'text-[#00F0FF]/70'}`} />
                    </motion.div>
                    <motion.div
                      animate={isDragging && !isDropping ? {
                        scale: [1, 1.05, 1],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      } : {}}
                    >
                      <button
                        type="button"
                        className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] hover:from-[#00F0FF]/90 hover:to-[#6D5BFF]/90 text-black text-lg font-semibold rounded-xl shadow-lg cursor-pointer transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isDragging ? 'Drop Image Here' : 'Select Image'}
                      </button>
                    </motion.div>
                    <motion.p 
                      className="mt-3 text-sm text-gray-400"
                      animate={{ opacity: isDragging ? 0.7 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDragging ? 'Release to upload' : 'PNG, JPG, GIF up to 50MB'}
                    </motion.p>
                  </motion.div>
                ) : (
                  <div className="w-full flex flex-col items-center py-2">
                    <div className="relative group">
                      <img
                        src={previewUrl}
                        alt="Uploaded preview"
                        className="w-full max-w-md max-h-[40vh] object-contain rounded-xl border border-gray-700 bg-gray-800/50 shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button
                          type="button"
                          className="px-4 py-2 text-base text-white bg-[#00F0FF] rounded-lg hover:bg-[#00F0FF]/90 transition"
                          onClick={() => { setPreviewUrl(null); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Section */}
              <div className="flex-1 flex flex-col gap-4 w-full">
                <Textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Enter a topic for your tweet/post (optional if image provided)"
                  className="w-full bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#00F0FF] focus:ring-[#00F0FF] min-h-[120px]"
                />
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] hover:from-[#00F0FF]/90 hover:to-[#6D5BFF]/90 text-black font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Twitter className="mr-2 h-4 w-4" /> Generate Content</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {(tweets.length > 0 || igs.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center gap-8 mt-10"
          >
            {tweets.length > 0 && (
              <div className="w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#00F0FF]">
                  <Twitter className="text-[#00F0FF]" /> Tweets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tweets.map((tweet, idx) => (
                    <Card key={idx} className="bg-gray-800/50 border-gray-700 hover:border-[#00F0FF]/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-[#00F0FF]">Tweet {idx+1}</span>
                          <span className="text-gray-200">{tweet}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {igs.length > 0 && (
              <div className="w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#00F0FF]">
                  <span className="inline-block bg-gradient-to-tr from-[#00F0FF] to-[#6D5BFF] rounded-full p-1">
                    <Instagram className="text-white" />
                  </span>
                  Instagram Posts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {igs.map((ig, idx) => (
                    <Card key={idx} className="bg-gray-800/50 border-gray-700 hover:border-[#00F0FF]/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-semibold text-[#00F0FF]">Post {idx+1}</span>
                          <span className="text-gray-200">{ig}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <Alert variant="destructive" className="bg-red-900/50 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
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
