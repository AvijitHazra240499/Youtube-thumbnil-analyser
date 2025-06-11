import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, Clock, Download, Edit, Eye, FileText, Save, Share2, Sparkles } from 'lucide-react';

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
  
  // Mock script generation
  const generateScript = () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Simulate script generation with progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          
          // Set mock data based on format
          if (format === 'shorts') {
            setScriptOutline(`1. Hook: Surprising fact\n2. Problem statement\n3. Solution reveal\n4. Call to action`);
            setFullScript(`Did you know that 87% of viral thumbnails use this one simple trick? [HOOK]\n\nCreators struggle to get clicks because they're missing this key element in their thumbnails. [PROBLEM]\n\nBy using high contrast colors and emotional expressions, you can boost your CTR by up to 40%! Here's how to implement it... [SOLUTION]\n\nTry this on your next 3 videos and comment below with your results! [CTA]`);
          } else if (format === 'howto') {
            setScriptOutline(`1. Introduction\n2. Problem overview\n3. Step 1: Research\n4. Step 2: Implementation\n5. Step 3: Optimization\n6. Results & conclusion`);
            setFullScript(`Welcome back to the channel! Today I'm showing you exactly how to create thumbnails that get CLICKS. [INTRO]\n\nThe biggest challenge most creators face is standing out in a crowded feed. Your thumbnail has less than 2 seconds to grab attention. [PROBLEM]\n\nSTEP 1: Research your niche. Find the top 10 videos in your category and analyze their thumbnail patterns. Look for color schemes, facial expressions, and text placement. [RESEARCH]\n\nSTEP 2: Create your template. Use contrasting colors (I recommend blue/orange or red/teal combinations), clear text under 4 words, and an emotional facial expression. [IMPLEMENTATION]\n\nSTEP 3: A/B test variations. Create 2-3 versions and test them with a small audience before finalizing. [OPTIMIZATION]\n\nFollowing this system, I've increased my CTR from 4% to 9.5% in just one month. Try these techniques and let me know your results in the comments! [CONCLUSION]`);
          } else {
            setScriptOutline(`1. Introduction\n2. Item #1\n3. Item #2\n4. Item #3\n5. Item #4\n6. Item #5\n7. Conclusion`);
            setFullScript(`Today we're counting down the 5 most effective thumbnail strategies that are working RIGHT NOW. [INTRO]\n\n#5: Pattern Interruption - Use unexpected elements that break the pattern of what viewers normally see in their feed. [ITEM]\n\n#4: Emotional Triggers - Facial expressions that convey strong emotions like surprise, excitement or curiosity drive significantly higher click rates. [ITEM]\n\n#3: Color Psychology - Using complementary colors creates visual tension that attracts the eye. Red/teal and blue/orange combinations perform best in tests. [ITEM]\n\n#2: Text Hierarchy - Limit text to 3-4 words maximum, with one word significantly larger than the others to create visual hierarchy. [ITEM]\n\n#1: The 3-Second Rule - Your thumbnail concept must be understood within 3 seconds or less, or viewers will scroll past. [ITEM]\n\nImplement these 5 strategies in your next video and watch your CTR skyrocket! Don't forget to like and subscribe for more creator tips. [CONCLUSION]`);
          }
          
          // Calculate word count and read time
          const words = fullScript.split(/\s+/).length;
          setWordCount(words);
          setReadTime(Math.ceil(words / 150)); // Assuming 150 words per minute reading speed
          
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="bg-black text-white w-full h-full p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Sparkles className="mr-2 text-[#00F0FF]" /> AI Script Factory
        </h2>
        <p className="text-gray-400">Generate optimized video scripts with AI assistance</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Script controls */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#00F0FF]">Script Settings</CardTitle>
            <CardDescription>Configure your script parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format selection */}
            <div className="space-y-2">
              <Label htmlFor="format">Content Format</Label>
              <Tabs defaultValue={format} onValueChange={setFormat} className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-gray-800">
                  <TabsTrigger value="shorts" className="data-[state=active]:bg-gray-700 data-[state=active]:text-[#00F0FF]">
                    Shorts
                  </TabsTrigger>
                  <TabsTrigger value="howto" className="data-[state=active]:bg-gray-700 data-[state=active]:text-[#00F0FF]">
                    How-To
                  </TabsTrigger>
                  <TabsTrigger value="listicle" className="data-[state=active]:bg-gray-700 data-[state=active]:text-[#00F0FF]">
                    Listicle
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Topic input */}
            <div className="space-y-2">
              <Label htmlFor="topic">Video Topic</Label>
              <Input 
                id="topic" 
                placeholder="Enter your video topic" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="bg-gray-800 border-gray-700 focus:border-[#00F0FF] focus:ring-[#00F0FF]" 
              />
            </div>

            {/* Tone slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="tone">Tone</Label>
                <span className="text-sm text-gray-400">{tone < 30 ? 'Formal' : tone > 70 ? 'Casual' : 'Balanced'}</span>
              </div>
              <Slider 
                id="tone" 
                min={0} 
                max={100} 
                step={1} 
                value={[tone]} 
                onValueChange={(value) => setTone(value[0])} 
                className="py-4" 
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Professional</span>
                <span>Balanced</span>
                <span>Conversational</span>
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>Selected Keywords</Label>
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

            {/* Advanced options */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <Label htmlFor="hooks" className="cursor-pointer">Include Hooks</Label>
                <Switch id="hooks" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cta" className="cursor-pointer">Add Call-to-Action</Label>
                <Switch id="cta" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="seo" className="cursor-pointer">SEO Optimization</Label>
                <Switch id="seo" defaultChecked />
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
                      className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                    >
                      {isPreviewMode ? <Edit /> : <Eye />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
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
                      className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                    >
                      <Save />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save Script</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={!fullScript}
                      className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                    >
                      <Download />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export Script</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={!fullScript}
                      className="border-gray-700 bg-gray-800 hover:bg-gray-700"
                    >
                      <Share2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Script</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          
          {isGenerating ? (
            <CardContent className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <Progress value={progress} className="h-2 w-64" />
                  <p className="mt-2 text-sm text-gray-400">{progress}% complete</p>
                </div>
                <p className="text-gray-400 max-w-md mx-auto">
                  Generating your {format} script with {tone < 30 ? 'formal' : tone > 70 ? 'casual' : 'balanced'} tone...
                </p>
              </div>
            </CardContent>
          ) : fullScript ? (
            <CardContent className="p-0">
              <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="p-4 h-full border-r border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-300">Script Outline</h3>
                      <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">Structure</Badge>
                    </div>
                    <ScrollArea className="h-[450px] pr-4">
                      <div className="whitespace-pre-line text-sm text-gray-400">
                        {scriptOutline}
                      </div>
                    </ScrollArea>
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle className="bg-gray-800" />
                
                <ResizablePanel defaultSize={70}>
                  <div className="p-4 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-300">Full Script</h3>
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
                        <div className="whitespace-pre-line text-gray-100">
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
              <h3 className="text-xl font-medium text-gray-400 mb-2">No Script Generated Yet</h3>
              <p className="text-gray-500 max-w-md">
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
        </Card>
      </div>
    </div>
  );
};

export default ScriptGenerator;
