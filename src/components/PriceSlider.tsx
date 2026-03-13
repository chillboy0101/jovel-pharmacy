"use client";

import React, { useState, useEffect, useRef } from "react";

interface PriceSliderProps {
  min: number;
  max: number;
  initialMin?: number;
  initialMax?: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceSlider({
  min,
  max,
  initialMin,
  initialMax,
  onChange,
}: PriceSliderProps) {
  const [minVal, setMinVal] = useState(initialMin ?? min);
  const [maxVal, setMaxVal] = useState(initialMax ?? max);
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = (value: number) =>
    Math.round(((value - min) / (max - min)) * 100);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, min, max]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxVal);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxVal, min, max]);

  useEffect(() => {
    setMinVal(initialMin ?? min);
    setMaxVal(initialMax ?? max);
  }, [initialMin, initialMax, min, max]);

  return (
    <div className="space-y-6">
      <div className="relative h-10 w-full">
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), maxVal - 1);
            setMinVal(value);
            minValRef.current = value;
            onChange(value, maxVal);
          }}
          className="thumb thumb--left pointer-events-none absolute z-[3] h-0 w-full outline-none"
          style={{ zIndex: minVal > max - 100 ? "5" : undefined }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), minVal + 1);
            setMaxVal(value);
            maxValRef.current = value;
            onChange(minVal, value);
          }}
          className="thumb thumb--right pointer-events-none absolute z-[4] h-0 w-full outline-none"
        />

        <div className="relative h-1 w-full rounded-full bg-border">
          <div
            ref={range}
            className="absolute h-1 rounded-full bg-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Price: <span className="font-semibold text-primary-dark">₵{minVal} — ₵{maxVal}</span>
        </span>
      </div>

      <style jsx>{`
        .thumb,
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .thumb::-webkit-slider-thumb {
          background-color: white;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 0 1px 1px #ced4da;
          cursor: pointer;
          height: 18px;
          width: 18px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
        }

        .thumb::-moz-range-thumb {
          background-color: white;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 0 1px 1px #ced4da;
          cursor: pointer;
          height: 18px;
          width: 18px;
          pointer-events: all;
          position: relative;
        }
      `}</style>
    </div>
  );
}
