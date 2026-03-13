"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AutoSliderProps {
  children: React.ReactNode[];
  interval?: number;
  showArrows?: boolean;
}

export default function AutoSlider({
  children,
  interval = 5000,
  showArrows = true,
}: AutoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleItems, setVisibleItems] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalItems = children.length;

  useEffect(() => {
    const updateVisibleItems = () => {
      if (window.innerWidth < 640) setVisibleItems(2);
      else if (window.innerWidth < 1024) setVisibleItems(3);
      else setVisibleItems(4);
    };
    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (totalItems - visibleItems + 1));
  }, [totalItems, visibleItems]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (totalItems - visibleItems + 1)) % (totalItems - visibleItems + 1));
  }, [totalItems, visibleItems]);

  useEffect(() => {
    if (!isPaused && totalItems > visibleItems) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalItems - visibleItems) return 0;
          return prev + 1;
        });
      }, interval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [interval, isPaused, totalItems, visibleItems]);

  if (totalItems === 0) return null;

  return (
    <div 
      className="group relative overflow-hidden pb-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * (100 / visibleItems)}%)` }}
      >
        {children.map((child, idx) => (
          <div 
            key={idx} 
            className="w-1/2 shrink-0 px-2.5 sm:w-1/3 lg:w-1/4"
          >
            {child}
          </div>
        ))}
      </div>

      {showArrows && totalItems > visibleItems && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-primary opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-primary opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      
      {/* Pagination dots */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2">
        {Array.from({ length: Math.max(0, totalItems - visibleItems + 1) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              currentIndex === i ? "w-6 bg-primary" : "w-1.5 bg-border"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
