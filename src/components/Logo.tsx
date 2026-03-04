import Link from "next/link";

export default function Logo({ className = "", hideText = false }: { className?: string; hideText?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Pharmacy cross icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20">
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="2" width="6" height="18" rx="1.5" fill="white" />
          <rect x="2" y="8" width="18" height="6" rx="1.5" fill="white" />
        </svg>
      </div>
      {!hideText && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Jovel
          </span>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary -mt-0.5">
            Pharmacy
          </span>
        </div>
      )}
    </Link>
  );
}
