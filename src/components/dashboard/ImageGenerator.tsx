import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Youtube, Upload, X } from "lucide-react";

// YouTube Thumbnail Generator component
const ThumbnailGenerator = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [images, setImages] = useState<string[]>([]); // base64 strings
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const fileToGenerativePart = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const generateThumbnail = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    setLoading(true);
    setError("");
    setImages([]);
    
    try {
      // Prepare the prompt
      let thumbnailPrompt = `Create a professional YouTube thumbnail for a video titled "${prompt}". 
      The thumbnail should be in 16:9 aspect ratio with the following elements:
      - A clean, modern design with a clear focal point
      - Bold, easy-to-read text with the main keyword highlighted
      - High contrast colors that pop (blues, oranges, and whites work well)
      - Professional icons or illustrations related to ${prompt}
      - A slightly 3D/realistic style with subtle shadows and highlights`;
      
      if (selectedImage) {
        thumbnailPrompt += `
      - Use the uploaded image as the main focal point
      - Make the thumbnail look like a professional YouTube thumbnail with the image as a key element`;
      } else {
        thumbnailPrompt += `
      - A professional color scheme with 1-2 accent colors
      - Space for text on the left or right side`;
      }
      
      thumbnailPrompt += `
      - No watermarks or text in the corners
      Make it look like a high-converting YouTube thumbnail that would get maximum clicks.`;

      // Prepare the request body
      const requestBody: any = {
        contents: [{
          parts: [
            { text: thumbnailPrompt }
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          candidateCount: 1,
          temperature: 0.8,
          topP: 0.9,
          topK: 32,
          maxOutputTokens: 2048,
        },
      };

      // Add image data if available
      if (selectedImage) {
        const imagePart = await fileToGenerativePart(selectedImage);
        requestBody.contents[0].parts.push(imagePart);
      }
      
      // Make the API request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
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
        console.error('No images in response:', data);
      } else {
        setImages(base64Imgs);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(`Failed to generate image: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#FF0000]">
            <Youtube className="h-5 w-5" /> YouTube Thumbnail Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your video content for thumbnail generation..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white focus:border-[#00F0FF] focus:ring-[#00F0FF]"
              />
              <Button
                disabled={loading || !prompt.trim()}
                onClick={generateThumbnail}
                className="bg-[#00F0FF] text-black hover:bg-[#00F0FF]/80"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin h-4 w-4" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {imagePreview && (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-16 w-16 object-cover rounded-md"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
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
                      <Youtube className="h-4 w-4 text-white" />
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

export default ThumbnailGenerator;
