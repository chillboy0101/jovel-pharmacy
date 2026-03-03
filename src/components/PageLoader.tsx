export default function PageLoader({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-3" style={{ minHeight: "60vh" }}>
      {/* Animated logo mark */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer pulse ring */}
        <span className="absolute inset-0 animate-ping rounded-2xl bg-primary opacity-20" />
        {/* Inner ring */}
        <span className="absolute inset-1 animate-pulse rounded-xl bg-primary/10" />
        {/* Logo icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <svg
            width="28"
            height="28"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="8" y="2" width="6" height="18" rx="1.5" fill="white" />
            <rect x="2" y="8" width="18" height="6" rx="1.5" fill="white" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-muted">{text}</p>
    </div>
  );
}
