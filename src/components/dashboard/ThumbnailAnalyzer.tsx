import React, { useState, useRef, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Loader2, MessageSquare, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTrial } from "@/contexts/TrialContext";
import { motion, AnimatePresence } from "framer-motion"; // For 3D/animated card effects
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
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout>();
  const dropTimeoutRef = useRef<NodeJS.Timeout>();
  const dragCounterRef = useRef(0);

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

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    
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
    dragCounterRef.current -= 1;
    
    if (dragCounterRef.current === 0 && !isDropping) {
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragging(false);
      }, 50);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && !isDropping) {
      setIsDragging(true);
    }
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    
    const file = e.dataTransfer.files?.[0];
    if (!file) {
      setIsDragging(false);
      return;
    }

    // Set dropping state before any other state changes
    setIsDropping(true);
    setIsDragging(false);
    
    const syntheticEvent = {
      target: {
        files: e.dataTransfer.files
      }
    } as React.ChangeEvent<HTMLInputElement>;

    try {
      // Process the file first
      await handleFileChange(syntheticEvent);
      
      // Then show the animation
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      // Ensure we always clean up the states
      dropTimeoutRef.current = setTimeout(() => {
        setIsDropping(false);
      }, 200);
    }
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
      dragCounterRef.current = 0;
    };
  }, []);

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
    <div
      className="w-full min-h-screen text-white relative p-10"
      style={{
        background: "radial-gradient(circle at 20% 20%, #232946 0%, #15161a 100%)",
        overflow: "hidden",
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/[0.1] via-transparent to-transparent animate-gradient blur-[100px] pointer-events-none" />
      
      {/* Drop Animation Overlay */}
      <AnimatePresence mode="wait">
        {isDropping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="fixed inset-0 bg-[#00F0FF]/20 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.8, rotate: 10, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.5,
                ease: "easeInOut"
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
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Upload className="w-12 h-12 text-black" />
                </motion.div>
              </div>
              {/* Particle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 0],
                    x: [0, Math.cos(i * Math.PI / 4) * 100],
                    y: [0, Math.sin(i * Math.PI / 4) * 100],
                    opacity: [1, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    ease: "easeOut",
                    delay: i * 0.05,
                    repeat: 0
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#00F0FF] rounded-full"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Faint grid background */}
      <div className="pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.11 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <rect width="36" height="36" fill="none" stroke="#00F0FF" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      {/* <div className="relative z-10"> */}
        {/* <div className="relative min-h-screen z-10 flex flex-col items-center justify-center overflow-hidden bg-black text-white"> */}
        <div className="relative z-10 flex flex-col items-center justify-center  text-white">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 -z-10 animate-gradient  from-[#1e3c72] via-[#2a5298] to-[#6dd5ed] bg-[length:400%_400%]" style={{filter: 'blur(2px)', opacity: 0.8}} />
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
              <motion.div 
                className={`w-full max-w-2xl min-h-[320px] h-auto flex flex-col items-center justify-center border-2 border-dashed rounded-2xl shadow-lg transition-all duration-300 p-0 md:p-2 backdrop-blur-sm relative overflow-hidden
                  ${isDragging && !isDropping
                    ? 'border-[#00F0FF] scale-105' 
                    : 'border-gray-600 hover:border-[#00F0FF]/50'}`}
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
                {!previewUrl ? (
                  <motion.div 
                    className="flex flex-col items-center justify-center w-full h-full py-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      animate={isDragging && !isDropping ? {
                        y: [0, -10, 0],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatType: "reverse"
                        }
                      } : {}}
                    >
                      <Upload className={`w-16 h-16 mb-4 transition-colors duration-300 ${isDragging && !isDropping ? 'text-[#00F0FF]' : 'text-[#00F0FF]/70'}`} />
                    </motion.div>
                    <motion.div
                      animate={isDragging && !isDropping ? {
                        scale: [1, 1.05, 1],
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatType: "reverse"
                        }
                      } : {}}
                    >
                      <button
                        type="button"
                        className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] hover:from-[#00F0FF]/90 hover:to-[#6D5BFF]/90 text-black text-lg font-semibold rounded-xl shadow-lg cursor-pointer transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isDragging && !isDropping ? 'Drop Image Here' : 'Select Image'}
                      </button>
                    </motion.div>
                    <motion.p 
                      className="mt-3 text-sm text-gray-400"
                      animate={{ opacity: isDragging && !isDropping ? 0.7 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDragging && !isDropping ? 'Release to upload' : 'PNG, JPG, GIF up to 50MB'}
                    </motion.p>
                  </motion.div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-6 transition-all duration-300">
                    <img
                      src={previewUrl}
                      alt="Uploaded image"
                      className="w-full max-w-2xl max-h-[60vh] object-contain rounded-2xl shadow-xl border border-gray-700 bg-gray-900/50 transition-all duration-300"
                      style={{ aspectRatio: '16/9' }}
                    />
                    <button
                      type="button"
                      className="mt-6 px-5 py-2 text-base text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => { setPreviewUrl(null); setSelectedFile(null); fileInputRef.current!.value = ''; }}
                    >Change Image</button>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="flex-1 flex flex-col items-center w-full max-w-md mt-8 md:mt-0">
              <Card className="w-full bg-gray-900/80 shadow-xl border border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-blue-400 text-2xl font-semibold text-center">Ask Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Enter your question about the image"
                      className="w-full bg-gray-800/50 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-purple-500/50"
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 text-white"
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
      {/* </div> */}
    </div>
  );
}

export default ThumbnailAnalyzer;
