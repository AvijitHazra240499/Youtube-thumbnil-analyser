import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Filter, ArrowUpDown, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  magicScore: number;
  trend: "up" | "down" | "stable";
  difficulty: "easy" | "medium" | "hard";
}

const KeywordMatrix = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [competitionFilter, setCompetitionFilter] = useState<[number, number]>([
    0, 100,
  ]);
  const [activeTab, setActiveTab] = useState("matrix");

  // Mock data for demonstration
  const mockKeywords: KeywordData[] = [
    {
      keyword: "AI thumbnail generator",
      searchVolume: 12500,
      competition: 75,
      magicScore: 87,
      trend: "up",
      difficulty: "medium",
    },
    {
      keyword: "YouTube SEO tips",
      searchVolume: 8700,
      competition: 92,
      magicScore: 65,
      trend: "up",
      difficulty: "hard",
    },
    {
      keyword: "Video editing for beginners",
      searchVolume: 22000,
      competition: 68,
      magicScore: 91,
      trend: "up",
      difficulty: "medium",
    },
    {
      keyword: "How to grow on YouTube",
      searchVolume: 33500,
      competition: 95,
      magicScore: 72,
      trend: "stable",
      difficulty: "hard",
    },
    {
      keyword: "Best camera for YouTube",
      searchVolume: 18200,
      competition: 88,
      magicScore: 76,
      trend: "down",
      difficulty: "hard",
    },
    {
      keyword: "Free video templates",
      searchVolume: 9800,
      competition: 45,
      magicScore: 89,
      trend: "up",
      difficulty: "easy",
    },
    {
      keyword: "YouTube algorithm 2023",
      searchVolume: 15600,
      competition: 82,
      magicScore: 81,
      trend: "up",
      difficulty: "medium",
    },
    {
      keyword: "Viral video ideas",
      searchVolume: 28900,
      competition: 79,
      magicScore: 85,
      trend: "up",
      difficulty: "medium",
    },
    {
      keyword: "YouTube shorts tips",
      searchVolume: 19700,
      competition: 62,
      magicScore: 94,
      trend: "up",
      difficulty: "easy",
    },
    {
      keyword: "Content creation tools",
      searchVolume: 7300,
      competition: 71,
      magicScore: 78,
      trend: "stable",
      difficulty: "medium",
    },
  ];

  const filteredKeywords = mockKeywords
    .filter((kw) => kw.keyword.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(
      (kw) =>
        kw.competition >= competitionFilter[0] &&
        kw.competition <= competitionFilter[1],
    );

  const toggleKeywordSelection = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const exportSelectedKeywords = () => {
    // In a real implementation, this would export the selected keywords
    console.log("Exporting keywords:", selectedKeywords);
    // Could trigger a download or send to another component
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <span className="text-green-500">↑</span>;
      case "down":
        return <span className="text-red-500">↓</span>;
      case "stable":
        return <span className="text-yellow-500">→</span>;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMagicScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-blue-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="w-full bg-black text-white p-6 rounded-xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center">
            Keyword Research Matrix
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Info className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Discover high-potential keywords using our Magic Score
                    algorithm
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Find high-potential keywords with our proprietary Magic Score
            algorithm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search keywords or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={exportSelectedKeywords}
                disabled={selectedKeywords.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export ({selectedKeywords.length})
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Competition Filter:</span>
              <div className="flex-1">
                <Slider
                  defaultValue={[0, 100]}
                  max={100}
                  step={1}
                  value={competitionFilter}
                  onValueChange={setCompetitionFilter}
                  className="py-4"
                />
              </div>
              <span className="text-sm text-gray-400">
                {competitionFilter[0]}% - {competitionFilter[1]}%
              </span>
            </div>

            <Tabs
              defaultValue="matrix"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger
                  value="matrix"
                  className="data-[state=active]:bg-gray-700"
                >
                  Heatmap Matrix
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="data-[state=active]:bg-gray-700"
                >
                  Data Table
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matrix" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredKeywords.map((keyword) => (
                    <div
                      key={keyword.keyword}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${selectedKeywords.includes(keyword.keyword) ? "bg-blue-900/30 border-2 border-[#00F0FF]" : "bg-gray-800 border border-gray-700 hover:border-gray-600"}`}
                      onClick={() => toggleKeywordSelection(keyword.keyword)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white truncate mr-2">
                          {keyword.keyword}
                        </h3>
                        <Badge
                          className={`${getDifficultyColor(keyword.difficulty)} text-white`}
                        >
                          {keyword.difficulty}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Search Volume</p>
                          <p className="font-medium text-white">
                            {keyword.searchVolume.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Competition</p>
                          <p className="font-medium text-white">
                            {keyword.competition}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Trend</p>
                          <p className="font-medium text-white flex items-center">
                            {getTrendIcon(keyword.trend)} {keyword.trend}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Magic Score</p>
                          <p
                            className={`font-bold ${getMagicScoreColor(keyword.magicScore)}`}
                          >
                            {keyword.magicScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="table" className="mt-4">
                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-800">
                      <TableRow className="hover:bg-gray-800 border-gray-700">
                        <TableHead className="text-gray-300 w-12">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-700 text-[#00F0FF] focus:ring-[#00F0FF]"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedKeywords(
                                    filteredKeywords.map((k) => k.keyword),
                                  );
                                } else {
                                  setSelectedKeywords([]);
                                }
                              }}
                              checked={
                                selectedKeywords.length ===
                                  filteredKeywords.length &&
                                filteredKeywords.length > 0
                              }
                            />
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-300">
                          <div className="flex items-center">
                            Keyword <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-gray-300 text-right">
                          Search Volume
                        </TableHead>
                        <TableHead className="text-gray-300 text-right">
                          Competition
                        </TableHead>
                        <TableHead className="text-gray-300 text-right">
                          Trend
                        </TableHead>
                        <TableHead className="text-gray-300 text-right">
                          Magic Score
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredKeywords.map((keyword) => (
                        <TableRow
                          key={keyword.keyword}
                          className={`hover:bg-gray-800 border-gray-700 ${selectedKeywords.includes(keyword.keyword) ? "bg-blue-900/30" : ""}`}
                        >
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-700 text-[#00F0FF] focus:ring-[#00F0FF]"
                              checked={selectedKeywords.includes(
                                keyword.keyword,
                              )}
                              onChange={() =>
                                toggleKeywordSelection(keyword.keyword)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium text-white">
                            {keyword.keyword}
                          </TableCell>
                          <TableCell className="text-right">
                            {keyword.searchVolume.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {keyword.competition}%
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              {getTrendIcon(keyword.trend)} {keyword.trend}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-bold ${getMagicScoreColor(keyword.magicScore)}`}
                            >
                              {keyword.magicScore}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeywordMatrix;
