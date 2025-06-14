import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, LoaderCircle, Download } from "lucide-react";

// Gemini image generation component
const ImageGenerator = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [images, setImages] = useState<string[]>([]); // base64 strings
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setImages([]);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              candidateCount: 1
            },

          }),
        }
      );
      const data = await response.json();
      // Attempt to extract base64 images; structure may change as API evolves
      const base64Imgs: string[] = [];
      (data.candidates || []).forEach((cand: any) => {
        (cand.content?.parts || []).forEach((p: any) => {
          const dataField = p.inline_data?.data || p.inlineData?.data;
          if (dataField) {
            base64Imgs.push(dataField);
          }
        });
      });
      if (base64Imgs.length === 0) {
        setError("No images were returned by the API. Please try a different prompt.");
      }
      setImages(base64Imgs);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate image. Please check your API key and prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#00F0FF]">
            <Sparkles className="h-5 w-5" /> Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe the image you want..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white focus:border-[#00F0FF] focus:ring-[#00F0FF]"
            />
            <Button
              disabled={loading || !prompt.trim()}
              onClick={generateImage}
              className="bg-[#00F0FF] text-black hover:bg-[#00F0FF]/80"
            >
              {loading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : (
                "Generate"
              )}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={`data:image/png;base64,${img}`}
                    alt={`Generated result ${idx + 1}`}
                    className="rounded-lg border border-gray-800"
                  />
                  <a
                    href={`data:image/png;base64,${img}`}
                    download={`generated_${idx + 1}.png`}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Button size="icon" variant="ghost" className="bg-gray-800/70 hover:bg-gray-700">
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerator;
