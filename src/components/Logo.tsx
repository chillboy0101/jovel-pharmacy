import Link from "next/link";
import Image from "next/image";

export default function Logo({ className = "", hideText = false }: { className?: string; hideText?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-transparent.png"
        alt="Jovel Pharmacy"
        width={hideText ? 44 : 180}
        height={hideText ? 44 : 48}
        priority
        className={hideText ? "h-11 w-11 object-contain" : "h-12 w-auto object-contain"}
      />
    </Link>
  );
}
