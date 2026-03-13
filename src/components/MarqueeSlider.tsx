"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { ArrowRight } from "lucide-react";

interface MarqueeSliderProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  badgeType?: string;
  href?: string;
  bg?: string;
}

export default function MarqueeSlider({ 
  products = [], 
  title = "Bestsellers", 
  subtitle = "Our most-loved products, trusted by thousands.",
  badgeType = "bestseller",
  href = "/shop?badge=bestseller",
  bg = "bg-muted-light"
}: MarqueeSliderProps) {
  // Duplicate the product array so the loop is seamless
  const doubled = [...products, ...products];

  if (products.length === 0) return null;

  return (
    <section className={`py-20 ${bg}`}>
      <div className="mx-auto max-w-7xl px-6">
        {/* Header matching original Jovel style */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-muted">
              {subtitle}
            </p>
          </div>
          <Link
            href={href}
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Slider Container */}
        <div 
          className="relative overflow-hidden w-full"
          role="region" 
          aria-label={`${title} carousel`}
        >
          {/* Fade left overlay */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${bg === 'bg-white' ? '#ffffff' : '#f1f5f9'}, transparent)` }} 
            aria-hidden="true"
          />

          {/* Fade right overlay */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${bg === 'bg-white' ? '#ffffff' : '#f1f5f9'}, transparent)` }} 
            aria-hidden="true"
          />

          {/* Scrolling Track using original ProductCard for consistent appearance and size */}
          <div 
            className="flex animate-marquee py-4 hover:pause-marquee" 
            style={{ width: "max-content" }}
          >
            {doubled.map((product, i) => (
              <div
                key={i}
                className="w-[280px] flex-shrink-0 mx-3"
                aria-hidden={i >= products.length}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
