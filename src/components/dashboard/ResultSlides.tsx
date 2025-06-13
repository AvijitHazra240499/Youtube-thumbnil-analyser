import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SlideData {
  title: string;
  content: string;
  color?: string;
}

interface ResultSlidesProps {
  slides: SlideData[];
}

export const ResultSlides: React.FC<ResultSlidesProps> = ({ slides }) => {
  const [index, setIndex] = useState(0);
  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-2 mb-4">
        <Button onClick={prev} variant="outline" size="sm" aria-label="Previous Slide">⟨</Button>
        <Button onClick={next} variant="outline" size="sm" aria-label="Next Slide">⟩</Button>
      </div>
      <div className="w-full max-w-xl min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="w-full"
          >
            <Card className="bg-white/10 backdrop-blur-lg shadow-2xl border-0 animate-slidein">
              <CardHeader>
                <CardTitle className={`text-2xl font-bold ${slides[index].color || "text-blue-400"}`}>{slides[index].title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-gray-900/80 p-4 rounded text-gray-100">
                  <span>{slides[index].content}</span>
                  <Button size="sm" className="ml-4" onClick={() => navigator.clipboard.writeText(slides[index].content)}>
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-1 mt-4">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? "bg-blue-400 scale-125" : "bg-gray-600"}`}
          />
        ))}
      </div>
    </div>
  );
};
