import Image from "next/image";

export default function PageLoader({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-3" style={{ minHeight: "calc(100vh - 80px)" }}>
      <Image
        src="/logo-transparent.png"
        alt="Jovel Pharmacy"
        width={320}
        height={96}
        priority
        className="h-16 w-auto object-contain sm:h-20"
      />
      <p className="text-sm font-medium tracking-wide text-muted/80">{text}</p>
    </div>
  );
}
