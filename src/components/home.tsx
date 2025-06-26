import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Sparkles,
  LineChart,
  Users,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      setSelectedThumbnail(file);
      const reader = new FileReader();
      reader.onload = () => {
        const preview = reader.result as string;
        setThumbnailPreview(preview);
        // Navigate to the existing thumbnail analyzer route
        navigate('/thumbnail-analyzer', { 
          state: { 
            thumbnailFile: file,
            thumbnailPreview: preview 
          }
        });
      };
      reader.readAsDataURL(file);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1
  });

  const handleRemoveThumbnail = () => {
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleKeywordResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      navigate('/keyword-matrix', { 
        state: { 
          initialKeyword: keywordInput.trim(),
          autoAnalyze: true 
        }
      });
    }
  };

  return (
    <div className="min-h-screen text-white relative">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #00F0FF 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Subtle gradient animation */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-[#1e3c72]/10 via-[#2a5298]/10 to-[#6dd5ed]/10 animate-gradient bg-[length:400%_400%]"
        style={{ filter: 'blur(100px)', opacity: 0.5 }}
      />

      {/* Main content with proper z-index */}
      <div className="relative z-10">
        {/* Header */}
        {/* <header className="border-b border-gray-800 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">viral<span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">IQ</span><span className="text-orange-500">🔥</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Help
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Settings
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Avatar>
                <AvatarImage
                  src={
                    user?.avatar ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=creator"
                  }
                />
                <AvatarFallback className="bg-gray-700 text-white">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header> */}

        {/* Main Content */}
        <main className="container mx-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-white">
              Welcome back, {user?.name || "Creator"}
            </h2>
            <p className="text-gray-400">
              Your dashboard is ready. Let's create something amazing today.
            </p>
          </div>

          {/* Quick Stats */}
          {/* Dynamic Quick Stats */}
          <DashboardStats />

          {/* Main Features */}
          <Tabs defaultValue="thumbnail" className="mb-8">
            <TabsList className="bg-gray-900 border border-gray-800 py-[22px]"
            // style={{border: '1px solid #00F0FF'}}
            >
              <TabsTrigger
                value="thumbnail"
                className="px-4 py-2 text-white transition-all duration-200 data-[state=active]:bg-[#00F0FF]/10 data-[state=active]:text-[#00F0FF] hover:bg-gray-800/50 mr-1"
              >
                Thumbnail Analyzer
              </TabsTrigger>
              <TabsTrigger
                value="script"
                className="px-4 py-2 text-white transition-all duration-200 data-[state=active]:bg-[#00F0FF]/10 data-[state=active]:text-[#00F0FF] hover:bg-gray-800/50 mx-1"
              >
                AI Script Factory
              </TabsTrigger>
              <TabsTrigger
                value="keyword"
                className="px-4 py-2 text-white transition-all duration-200 data-[state=active]:bg-[#00F0FF]/10 data-[state=active]:text-[#00F0FF] hover:bg-gray-800/50 mx-1"
              >
                Keyword Research
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="thumbnail" className="mt-4" asChild>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Thumbnail Analyzer
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Upload your thumbnail to analyze trends and get performance
                        insights.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                          isDragActive 
                            ? 'border-[#00F0FF] bg-[#00F0FF]/5' 
                            : 'border-gray-700 hover:border-[#00F0FF]'
                        }`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full h-full"
                        >
                          <input {...getInputProps()} />
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                          <p className="text-lg font-medium text-white">
                            {isDragActive
                              ? "Drop your thumbnail here"
                              : "Drag & drop your thumbnail here"}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            or click to browse files
                          </p>
                          <Button className="mt-4 bg-[#00F0FF] text-black hover:bg-[#00F0FF]/80">
                            Upload Thumbnail
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="script" className="mt-4" asChild>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        AI Script Factory
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Generate optimized video scripts with AI assistance.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            title: "Shorts Script",
                            description:
                              "Engaging 60-second scripts for vertical video",
                            badge: "Popular",
                          },
                          {
                            title: "How-To Tutorial",
                            description: "Step-by-step instructional content",
                            badge: "",
                          },
                          {
                            title: "Listicle Format",
                            description: "Ranked items with compelling hooks",
                            badge: "New",
                          },
                        ].map((template, index) => (
                          <motion.div
                            key={index}
                            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-[#00F0FF] cursor-pointer"
                            whileHover={{ y: -5 }}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-medium text-lg text-white">
                                {template.title}
                              </h3>
                              {template.badge && (
                                <Badge className="bg-[#00F0FF] text-black">
                                  {template.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                              {template.description}
                            </p>
                            <Button
                              variant="ghost"
                              className="text-[#00F0FF] p-0 flex items-center gap-2"
                            >
                              Use Template <ArrowRight className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="keyword" className="mt-4" asChild>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">
                        Keyword Research Matrix
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Discover high-potential keywords with our Magic Score
                        algorithm.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <form onSubmit={handleKeywordResearch} className="flex gap-2 mb-4">
                            <input
                              type="text"
                              placeholder="Enter your topic..."
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                            />
                            <Button 
                              type="submit"
                              className="bg-[#00F0FF] text-black hover:bg-[#00F0FF]/80"
                              disabled={!keywordInput.trim()}
                            >
                              Research
                            </Button>
                          </form>
                          <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div className="bg-gray-700 p-2 rounded">
                              <p className="text-gray-400">Search Volume</p>
                              <p className="font-bold">--</p>
                            </div>
                            <div className="bg-gray-700 p-2 rounded">
                              <p className="text-gray-400">Competition</p>
                              <p className="font-bold">--</p>
                            </div>
                            <div className="bg-gray-700 p-2 rounded">
                              <p className="text-gray-400">Trend Score</p>
                              <p className="font-bold">--</p>
                            </div>
                            <div className="bg-gray-700 p-2 rounded">
                              <p className="text-gray-400">Magic Score</p>
                              <p className="font-bold text-[#00F0FF]">--</p>
                            </div>
                          </div>
                        </div>
                        {/* 
                        <div className="bg-gray-800 p-4 rounded-lg h-64 flex items-center justify-center">
                          <p className="text-gray-500">
                            Enter a topic to see keyword research results
                          </p>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          {/* Recent Activity */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your latest actions and updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
            <CardFooter className="border-t border-gray-800 flex justify-center">
              <Button
                variant="ghost"
                className="text-[#00F0FF]"
                onClick={() => navigate('/activity')}
              >
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Home;
