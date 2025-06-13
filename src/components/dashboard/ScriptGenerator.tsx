import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, Clock, Download, Edit, Eye, FileText, Save, Share2, Sparkles } from 'lucide-react';
import { ResultSlides } from "./ResultSlides";

interface ScriptGeneratorProps {
  keywords?: string[];
  initialFormat?: 'shorts' | 'howto' | 'listicle';
}

const ScriptGenerator = ({ keywords = [], initialFormat = 'shorts' }: ScriptGeneratorProps) => {
  const [format, setFormat] = useState<string>(initialFormat);
  const [tone, setTone] = useState<number>(50); // 0-100 scale for tone (formal to casual)
  const [topic, setTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [scriptOutline, setScriptOutline] = useState<string>('');
  const [fullScript, setFullScript] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);
  const [readTime, setReadTime] = useState<number>(0);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Only declare these ONCE inside the component
  const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "balanced", label: "Balanced" },
    { value: "conventional", label: "Conventional" },
  ];
  const FORMAT_OPTIONS = [
    { value: "shorts", label: "Shorts" },
    { value: "howto", label: "How To" },
    { value: "listicle", label: "Listicle" },
  ];
  const SLIDE_COLORS = [
    "text-pink-400", "text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400"
  ];
  const [toneStyle, setToneStyle] = useState<string>(TONE_OPTIONS[1].value); // balanced default
  const [showSlides, setShowSlides] = useState<boolean>(false);
  const [slides, setSlides] = useState<any[]>([]);

  // --- Use Groq API for real script generation ---
  const [fallbackWarning, setFallbackWarning] = useState<string>("");

  const generateScript = async () => {
    setIsGenerating(true);
    setProgress(0);
    setShowSlides(false);
    setSlides([]);
    setScriptOutline("");
    setFullScript("");
    setFallbackWarning("");

    // Simulate progress bar
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setProgress(prog);
      if (prog >= 100) clearInterval(interval);
    }, 100);

    // Prepare prompt based on dropdowns
    let prompt = "";
    if (format === "shorts") prompt = `Generate a YouTube Shorts script for the topic '${topic}' in a ${toneStyle} style.`;
    else if (format === "howto") prompt = `Generate a step-by-step 'How To' YouTube script for the topic '${topic}' in a ${toneStyle} style.`;
    else prompt = `Generate a Listicle YouTube script for the topic '${topic}' in a ${toneStyle} style.`;

    // --- Try Groq API ---
    let script = null;
    let groqFailed = false;
    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1200,
          temperature: 0.7
        })
      });
      if (!response.ok) {
        groqFailed = true;
        throw new Error(`Groq API error: ${response.status}`);
      }
      const data = await response.json();
      script = data.choices?.[0]?.message?.content;
      if (!script) {
        groqFailed = true;
        throw new Error("Groq API returned no script");
      }
    } catch (err) {
      groqFailed = true;
    }

    // --- Fallback to OpenRouter if Groq fails ---
    if (groqFailed) {
      setFallbackWarning("Groq API failed, using OpenRouter fallback (mistralai/mistral-nemo:free)");
      try {
        const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.OPENROUTER_API_KEY;
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`
          },
          body: JSON.stringify({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1200,
            temperature: 0.7
          })
        });
        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }
        const data = await response.json();
        script = data.choices?.[0]?.message?.content;
      } catch (err) {
        setFullScript("[Failed to generate script: Both Groq and OpenRouter failed. Please check your API keys and connection.]");
        setShowSlides(false);
        setIsGenerating(false);
        setProgress(100);
        return;
      }
    }

    // --- Success: Use whichever script was generated ---
    setFullScript(script);
    setScriptOutline("AI generated outline unavailable");

    // Attempt to detect tone/style from the script (first line or tag)
    const lowerScript = script.toLowerCase();
    let detectedTone = null;
    if (lowerScript.includes("professional")) detectedTone = "professional";
    else if (lowerScript.includes("balanced")) detectedTone = "balanced";
    else if (lowerScript.includes("conversational") || lowerScript.includes("conventional")) detectedTone = "conventional";
    if (detectedTone && TONE_OPTIONS.some(opt => opt.value === detectedTone)) {
      setToneStyle(detectedTone);
    }

    // Split script into slides for animated display
    const splitSlides = script.split(/\n\n|\n/).filter(Boolean).map((s, i) => ({
      title: `${format.charAt(0).toUpperCase() + format.slice(1)} Slide ${i + 1}`,
      content: s,
      color: SLIDE_COLORS[i % SLIDE_COLORS.length]
    }));
    setSlides(splitSlides);
    setShowSlides(true);
    setWordCount(script.split(/\s+/).length);
    setReadTime(Math.ceil(script.split(/\s+/).length / 150));
    setIsGenerating(false);
    setProgress(100);
  };


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white w-full h-full p-6">
      {/* Background Elements */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00F0FF]/[0.03] via-transparent to-transparent bg-[length:24px_24px] pointer-events-none" /> */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/[0.1] via-transparent to-transparent animate-gradient blur-[100px] pointer-events-none" />
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* SEO Optimization */}
        <Helmet>
          <title>AI YouTube Script Generator | Optimize Your Video Scripts</title>
          <meta name="description" content="Generate optimized, high-quality YouTube video scripts with AI. Choose your tone, format, and get instant results!" />
        </Helmet>
        {/* Call-to-Action */}
        <div className="my-4 p-4 bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] rounded-lg shadow-lg flex flex-col items-center relative z-10">
          <span className="text-xl font-semibold text-black mb-2">Ready to create your next viral video?</span>
          <span className="text-lg text-white mb-2">Enter your topic and click <b>Generate Script</b> to get started!</span>
          <Button size="lg" className="bg-[#00F0FF] text-black font-bold mt-2 px-8 py-3 text-lg hover:bg-[#6D5BFF] hover:text-white transition-all" onClick={generateScript} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Script Now'}
          </Button>
        </div>
        {/* Animated wrapper for the UI */}
        {/**
         * motion.div from framer-motion supports initial, animate, transition props
         * Ensure no stray angle brackets or JSX issues
         */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          {/* Fallback warning alert */}
          {fallbackWarning && (
            <div className="mb-4 p-3 rounded bg-yellow-200 text-yellow-900 font-semibold border border-yellow-400 animate-pulse">
              ⚠️ {fallbackWarning}
            </div>
          )}
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Sparkles className="mr-2 text-[#00F0FF]" /> AI Script Factory
          </h2>
          <p className="text-gray-400">Generate optimized video scripts with AI assistance</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Left panel - Script controls */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-[#00F0FF]">Script Settings</CardTitle>
              <CardDescription className="text-gray-200">Configure your script parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format selection (Dropdown) */}
              <div className="space-y-2">
                <Label htmlFor="format" className="text-white">Content Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-[#00F0FF]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Tone selection (Dropdown ONLY) */}
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-white">Tone/Style</Label>
                <Select value={toneStyle} onValueChange={setToneStyle}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border border-gray-700 shadow-lg">
                    {TONE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-gray-800 focus:bg-gray-800">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic input */}
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-white">Video Topic</Label>
                <Input 
                  id="topic" 
                  placeholder="Enter your video topic" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  className="bg-gray-800 border-gray-700 focus:border-[#00F0FF] focus:ring-[#00F0FF] text-white placeholder-gray-300" 
                />
              </div>


              {/* Keywords */}
              <div className="space-y-2">
                <Label className="text-white">Selected Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {keywords.length > 0 ? (
                    keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-800 text-[#00F0FF] border border-[#00F0FF]/30">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No keywords selected. Use the Keyword Matrix to add keywords.</p>
                  )}
                </div>
              </div>


            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateScript} 
                disabled={isGenerating || !topic} 
                className="w-full bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black"
              >
                {isGenerating ? (
                  <>
                    <span className="mr-2">Generating</span>
                    <Progress value={progress} className="h-2 w-16" />
                  </>
                ) : (
                  <>Generate Script</>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Right panel - Script editor */}
          <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#00F0FF]">
                  {format === 'shorts' ? 'Shorts Script' : 
                   format === 'howto' ? 'How-To Tutorial Script' : 
                   'Listicle Script'}
                </CardTitle>
                <CardDescription>
                  {isGenerating ? 'Generating your script...' : 
                   fullScript ? 'Your script is ready to edit' : 
                   'Configure settings and generate a script'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        disabled={!fullScript}
                        className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        {isPreviewMode ? <Edit className="text-white" /> : <Eye className="text-white" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border border-gray-700">
                      {isPreviewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        disabled={!fullScript}
                        className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        <Save className="text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border border-gray-700">Save Script</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        disabled={!fullScript}
                        className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        <Download className="text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border border-gray-700">Export Script</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        disabled={!fullScript}
                        className="border-gray-600 bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        <Share2 className="text-white" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-white border border-gray-700">Share Script</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <>
            {isGenerating ? (
              <CardContent className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <Progress value={progress} className="h-2 w-64 animate-pulse bg-gradient-to-r from-[#00F0FF] via-pink-500 to-purple-400" />
                    <p className="mt-2 text-sm text-gray-400">{progress}% complete</p>
                  </div>
                  <p className="text-gray-400 max-w-md mx-auto animate-fadein">
                    Generating your {format} script in {toneStyle} style...
                  </p>
                </div>
              </CardContent>
            ) : showSlides && slides.length > 0 ? (
              <CardContent className="p-0">
                <div className="min-h-[500px] flex items-center justify-center">
                  <ResultSlides slides={slides} />
                </div>
              </CardContent>
            ) : fullScript ? (
              <CardContent className="p-0">
                <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
                  <ResizablePanel defaultSize={30} minSize={20}>
                    <div className="p-4 h-full border-r border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-white">Script Outline</h3>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">Structure</Badge>
                      </div>
                      <ScrollArea className="h-[450px] pr-4">
                        <div className="whitespace-pre-line text-sm text-gray-200">
                          {scriptOutline}
                        </div>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle className="bg-gray-800" />
                  <ResizablePanel defaultSize={70}>
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-white">Full Script</h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            <span>{wordCount} words</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{readTime} min read</span>
                          </div>
                        </div>
                      </div>
                      <ScrollArea className="h-[450px] pr-4">
                        {isPreviewMode ? (
                          <div className="whitespace-pre-line text-white">
                            {fullScript}
                          </div>
                        ) : (
                          <Textarea 
                            value={fullScript} 
                            onChange={(e) => setFullScript(e.target.value)}
                            className="min-h-[450px] bg-gray-800 border-gray-700 resize-none focus:border-[#00F0FF] focus:ring-[#00F0FF]"
                          />
                        )}
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </CardContent>
            ) : (
              <CardContent className="h-[500px] flex flex-col items-center justify-center text-center">
                <BookOpen className="h-16 w-16 text-gray-700 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No Script Generated Yet</h3>
                <p className="text-gray-200 max-w-md">
                  Configure your script settings and click "Generate Script" to create your content.
                </p>
              </CardContent>
            )}

            {fullScript && (
              <CardFooter className="border-t border-gray-800 flex justify-between">
                <div className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                    Version History
                  </Button>
                  <Button size="sm" className="bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-black">
                    Finalize Script
                  </Button>
                </div>
              </CardFooter>
            )}
            </>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerator;
