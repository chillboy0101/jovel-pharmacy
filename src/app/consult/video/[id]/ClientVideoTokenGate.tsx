"use client";

import { useEffect, useMemo, useState } from "react";
import VideoConsultationCall from "@/components/VideoConsultationCall";

function parseHashToken() {
  if (typeof window === "undefined") return undefined;
  const hash = window.location.hash || "";
  const m = hash.match(/(?:^#|&)token=([^&]+)/i);
  return m ? decodeURIComponent(m[1]) : undefined;
}

function parseQueryToken() {
  if (typeof window === "undefined") return undefined;
  const sp = new URLSearchParams(window.location.search);
  const t = sp.get("token") ?? undefined;
  return t || undefined;
}

function storageKey(consultationId: string) {
  return `consult_video_token:${consultationId}`;
}

export default function ClientVideoTokenGate({ consultationId }: { consultationId: string }) {
  const [token] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const key = storageKey(consultationId);
    const hashToken = parseHashToken();
    const queryToken = parseQueryToken();
    const saved = window.sessionStorage.getItem(key) ?? undefined;
    return hashToken || queryToken || saved;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKey(consultationId);
    if (token) {
      window.sessionStorage.setItem(key, token);
    }

    // Clean URL: remove query + hash to avoid leaking token in screenshots / copy-paste / history
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      url.hash = "";
      window.history.replaceState(null, "", url.pathname);
    } catch {
      // ignore
    }
  }, [consultationId, token]);

  const mode = useMemo(() => "client" as const, []);

  return <VideoConsultationCall consultationId={consultationId} token={token} mode={mode} />;
}
