import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LayoutGrid } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// KeywordMatrix component
const KeywordMatrix: React.FC = () => {
  // State variables
  const [pendingTerm, setPendingTerm] = useState("");
  const [keywordResults, setKeywordResults] = useState<any[]>([]);
  const [loadingKeyword, setLoadingKeyword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<any | null>(null);

  // Handler for searching keywords
  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingKeyword(true);
    setError(null);
    setKeywordResults([]);
    try {
      // Real API call to backend
      try {
        // Always use suggest=5
        const apiBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/analyze_keyword?query=${encodeURIComponent(pendingTerm)}&suggest=5`);
        if (!res.ok) {
          throw new Error('Failed to fetch keyword data from backend');
        }
        const data = await res.json();
        setKeywordResults(data.keywords || []);
      } catch (err) {
        console.error('Keyword API error:', err);
        setError("Failed to fetch keyword data. Check network and CORS settings.");
      }
      setLoadingKeyword(false);
    } catch (err: any) {
      setError("Failed to fetch keyword data.");
      setLoadingKeyword(false);
    }
  };

  // Handler for showing keyword details
  const handleShowDetails = (keyword: any) => {
    setSelectedKeyword(keyword);
  };

  // --- Modern Consistent Page Header ---
  const pageHeader = (
    <div className="w-full max-w-5xl mx-auto mb-8 mt-2">
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#00F0FF] drop-shadow mb-2 tracking-tight text-center">
        Keyword Research
      </h2>
      <p className="text-center text-gray-300 mb-2 max-w-2xl mx-auto text-lg">
        Discover trending and high-potential keywords for your next viral video.
      </p>
      <div className="w-24 h-1 mx-auto bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] rounded-full mb-2" />
    </div>
  );

  return (
    <div
      className="w-full min-h-screen text-white relative"
      style={{
        background: "radial-gradient(circle at 20% 20%, #232946 0%, #15161a 100%)",
        overflow: "hidden"
      }}
    >
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
      <div className="relative z-10">
        {pageHeader}
        <div className="p-6">
          <Card className="bg-gradient-to-br from-[#232946] via-[#181a20] to-[#232946] border-0 shadow-2xl max-w-5xl mx-auto rounded-2xl">
            <CardHeader>
              <CardTitle className="text-[#00F0FF] text-2xl flex items-center gap-2">
                <LayoutGrid className="w-7 h-7 text-[#6D5BFF] drop-shadow-lg" />
                Keyword Search
              </CardTitle>
              <CardDescription className="text-gray-300">Find trending keywords and analyze their potential</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleKeywordSearch}
                className="flex flex-col md:flex-row gap-4 mb-6"
              >
                <Input
                  placeholder="Enter a keyword (e.g., money, youtube, ai)..."
                  value={pendingTerm}
                  onChange={e => setPendingTerm(e.target.value)}
                  className="bg-[#232946] border border-[#6D5BFF] text-white flex-1 font-semibold text-lg shadow-inner focus:ring-2 focus:ring-[#00F0FF]"
                  style={{ minHeight: 44 }}
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#00F0FF] via-[#6D5BFF] to-[#00F0FF] text-white font-bold shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200"
                  disabled={loadingKeyword || !pendingTerm.trim()}
                  style={{ minWidth: 120, minHeight: 44, fontSize: 18 }}
                >
                  {loadingKeyword ? (
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    <>Analyze</>
                  )}
                </Button>
              </form>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-base rounded-xl overflow-hidden">
                  <thead>
                    <tr className="border-b border-[#00F0FF] bg-[#181a20]">
                      <th className="py-3 px-3 text-[#00F0FF] font-bold text-lg">&nbsp;</th>
                      <th className="py-3 px-3 text-[#00F0FF] font-bold text-lg">Keyword</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Search Volume</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Competition</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Trend</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Difficulty</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Magic Score</th>
                      <th className="py-3 px-3 text-[#6D5BFF] font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordResults.length === 0 && !loadingKeyword ? (
                      <tr>
                        <td colSpan={8} className="text-center text-gray-500 py-8">
                          No results yet. Try searching for a keyword!
                        </td>
                      </tr>
                    ) : (
                      keywordResults.map((row, idx) => {
                        let magicColor = row.magicScore >= 80 ? '#00FFB2' : row.magicScore >= 65 ? '#FFD700' : '#FF5C5C';
                        return (
                          <tr
                            key={row.keyword + idx}
                            className="border-b border-gray-800 group hover:bg-gradient-to-l hover:from-[#232946] hover:to-[#181a20] hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="py-2 px-3">
                              <LayoutGrid className="w-6 h-6 text-[#6D5BFF] opacity-80 group-hover:scale-110 group-hover:text-[#00F0FF] transition-transform duration-200" />
                            </td>
                            <td className="py-2 px-3 font-bold text-white text-lg group-hover:text-[#00F0FF]" style={{ letterSpacing: 0.5 }}>{row.keyword}</td>
                            <td className="py-2 px-3 font-semibold text-[#E0E7FF]">{row.searchVolume}</td>
                            <td className="py-2 px-3 font-semibold text-[#E0E7FF]">{row.competition}</td>
                            <td className="py-2 px-3 font-semibold text-[#E0E7FF]">{row.trend}</td>
                            <td className="py-2 px-3 font-semibold text-[#E0E7FF]">{row.difficulty}</td>
                            <td className="py-2 px-3 font-extrabold" style={{ color: magicColor, fontSize: 18 }}>{row.magicScore}</td>
                            <td className="py-2 px-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShowDetails(row)}
                                className="border-[#00F0FF] text-[#00F0FF] bg-[#181a20] hover:bg-[#00F0FF]/20 hover:scale-110 transition-transform duration-200 shadow"
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Modal for details */}
              <Dialog open={!!selectedKeyword} onOpenChange={() => setSelectedKeyword(null)}>
                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Keyword Details</DialogTitle>
                    <DialogDescription>
                      Detailed AI-powered recommendations and SEO tips for <span className="text-[#00F0FF] font-bold">{selectedKeyword?.keyword}</span>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 mt-4">
                    <div><span className="font-semibold">Search Volume:</span> {selectedKeyword?.searchVolume}</div>
                    <div><span className="font-semibold">Competition:</span> {selectedKeyword?.competition}</div>
                    <div><span className="font-semibold">Trend:</span> {selectedKeyword?.trend}</div>
                    <div><span className="font-semibold">Difficulty:</span> {selectedKeyword?.difficulty}</div>
                    <div><span className="font-semibold">Magic Score:</span> <span style={{ color: selectedKeyword?.magicScore >= 80 ? '#00FFB2' : selectedKeyword?.magicScore >= 65 ? '#FFD700' : '#FF5C5C' }}>{selectedKeyword?.magicScore}</span></div>
                    <div className="mt-2"><span className="font-semibold">AI Recommendations:</span> {selectedKeyword?.recommendations}</div>
                    <div><span className="font-semibold">SEO Tips:</span> {selectedKeyword?.seoTips}</div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setSelectedKeyword(null)} className="bg-gradient-to-r from-[#00F0FF] to-[#6D5BFF] text-white font-bold">Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

};

export default KeywordMatrix;