# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Jovel Pharmacy — a premium, full-featured pharmacy website with e-commerce catalog, prescription workflows, consultation booking, and user accounts. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Production build (uses Turbopack)
- `npm run start` — Serve the production build
- `npm run lint` — Run ESLint

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (`src/app/`)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` — custom design tokens defined in `src/app/globals.css` using `@theme inline`
- **Icons**: Lucide React
- **Font**: Inter via `next/font/google`

### Directory Layout
- `src/app/` — Next.js App Router pages (each folder = route)
- `src/components/` — Shared UI components (Navbar, Footer, Logo, ProductCard)
- `src/context/` — React Context providers (CartContext, AuthContext)
- `src/data/` — Static typed mock data (products, categories, services, testimonials, team)

### State Management
Two React Context providers wrap the entire app in `src/app/layout.tsx`:
- **CartContext** (`src/context/CartContext.tsx`) — Shopping cart state with add/remove/update/clear. Exposes `useCart()` hook.
- **AuthContext** (`src/context/AuthContext.tsx`) — Mock authentication with login/signup/logout. Exposes `useAuth()` hook.

Both are client-side only ("use client"). No external state library is used.

### Data Layer
All data is static TypeScript arrays in `src/data/`. Each file exports a type and a const array:
- `products.ts` — 24 products across 6 categories with typed `Product` interface (id, name, brand, category, price, originalPrice, description, dosage, rating, reviews, inStock, badge, emoji)
- `categories.ts` — 6 categories with `Category` type
- `services.ts` — 6 pharmacy services with features lists
- `testimonials.ts` — 4 customer reviews
- `team.ts` — 4 team members

To add real products, replace the arrays in these files while keeping the same type shapes.

### Design System
Custom color tokens are defined in `globals.css` via `@theme inline`:
- `--color-primary` / `primary-dark` / `primary-light` — Emerald/teal palette
- `--color-accent` / `accent-dark` — Amber for CTAs and ratings
- `--color-muted` / `muted-light` — Slate for secondary text and backgrounds
- `--color-border` — Light border color

Utility CSS classes: `.glass`, `.gradient-primary`, `.gradient-hero`, `.text-gradient`, `.animate-fade-in-up`, `.animate-slide-in-right`

### Key Patterns
- Pages that use `useSearchParams()` must be wrapped in `<Suspense>` (see `src/app/shop/page.tsx`)
- Icons from Lucide are mapped to string keys in data files via `iconMap` objects in page components
- Product images use emoji placeholders (`product.emoji`) — designed to be replaced with real `<Image>` tags
- The SVG logo in `src/components/Logo.tsx` is a placeholder — swap it when the real logo is available
- Forms use native HTML validation (`required`) with mock submissions (no backend yet)
- Payment on checkout is a Stripe placeholder — integration point is in `src/app/checkout/page.tsx`

### Routes
| Path | Description |
|------|-------------|
| `/` | Home — hero, categories, bestsellers, testimonials, CTAs |
| `/shop` | Product catalog with filters, search, sort |
| `/shop/[id]` | Product detail with add-to-cart |
| `/cart` | Shopping cart with quantity controls and promo input |
| `/checkout` | Checkout with shipping/payment forms |
| `/services` | All pharmacy services |
| `/prescriptions` | Upload, transfer, or refill prescriptions (tabbed forms) |
| `/consult` | Book a pharmacist consultation (video/phone/in-store) |
| `/about` | Company story, values, team, certifications |
| `/contact` | Contact form, store info, map placeholder, live chat CTA |
| `/account` | Sign-in/sign-up + authenticated dashboard with order history |
