"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mic, MicOff, VideoOff, PhoneOff, RefreshCcw } from "lucide-react";

type JoinResponse = {
  roomId: string;
  consultationId: string;
  whoami: "staff" | "client";
};

type Signal = {
  id: string;
  roomId: string;
  sender: "staff" | "client";
  kind: "offer" | "answer" | "ice" | "presence" | "hangup";
  payload: unknown;
  createdAt: string;
};

export default function VideoConsultationCall({
  consultationId,
  token,
  mode,
}: {
  consultationId: string;
  token?: string;
  mode: "staff" | "client";
}) {
  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [whoami, setWhoami] = useState<"staff" | "client" | null>(null);

  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sinceRef = useRef<{ since: string | null; sinceId: string | null }>({
    since: null,
    sinceId: null,
  });

  const canInitiateOffer = useMemo(() => whoami === "client", [whoami]);

  const joinUrl = useMemo(() => {
    const base = `/api/consultations/${consultationId}/video/join`;
    if (mode === "client" && token) return `${base}?token=${encodeURIComponent(token)}`;
    return base;
  }, [consultationId, mode, token]);

  const postSignal = useCallback(
    async (kind: Signal["kind"], payload: unknown) => {
      if (!roomId) return;
      const url = mode === "client" && token
        ? `/api/video/${roomId}?token=${encodeURIComponent(token)}`
        : `/api/video/${roomId}`;

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, payload }),
      });
    },
    [roomId, mode, token],
  );

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        postSignal("ice", e.candidate.toJSON());
      }
    };

    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(e.track);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setCallError("Connection failed. Try reconnecting.");
      }
    };

    pcRef.current = pc;
    return pc;
  }, [postSignal]);

  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  }, []);

  const attachTracks = useCallback(async () => {
    const pc = await ensurePeerConnection();
    const stream = localStreamRef.current ?? (await startMedia());

    const senders = pc.getSenders();
    const existingTrackIds = new Set(
      senders.map((s) => s.track?.id).filter(Boolean) as string[],
    );

    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        pc.addTrack(track, stream);
      }
    });
  }, [ensurePeerConnection, startMedia]);

  const createAndSendOffer = useCallback(async () => {
    const pc = await ensurePeerConnection();
    await attachTracks();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await postSignal("offer", offer);
  }, [attachTracks, ensurePeerConnection, postSignal]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const pc = await ensurePeerConnection();
      await attachTracks();

      if (pc.signalingState !== "stable") return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postSignal("answer", answer);
    },
    [attachTracks, ensurePeerConnection, postSignal],
  );

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = await ensurePeerConnection();
    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, [ensurePeerConnection]);

  const handleIce = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = await ensurePeerConnection();
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // ignore
    }
  }, [ensurePeerConnection]);

  const endCall = useCallback(
    (notify: boolean) => {
      if (notify) {
        postSignal("hangup", { at: new Date().toISOString() }).catch(() => {});
      }

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      pcRef.current?.close();
      pcRef.current = null;

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      remoteStreamRef.current = null;

      setStarted(false);
      setStarting(false);
      setCallError(null);
    },
    [postSignal],
  );

  const pollSignals = useCallback(async () => {
    if (!roomId) return;

    const { since, sinceId } = sinceRef.current;
    const params = new URLSearchParams();
    if (since) params.set("since", since);
    if (sinceId) params.set("sinceId", sinceId);
    if (mode === "client" && token) params.set("token", token);

    const res = await fetch(`/api/video/${roomId}?${params.toString()}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      signals: Signal[];
      nextSince: string | null;
      nextSinceId: string | null;
    };

    sinceRef.current = { since: data.nextSince, sinceId: data.nextSinceId };

    for (const s of data.signals) {
      if (s.sender === whoami) continue;
      if (s.kind === "offer" && mode === "staff") {
        await handleOffer(s.payload as RTCSessionDescriptionInit);
      }
      if (s.kind === "answer" && mode === "client") {
        await handleAnswer(s.payload as RTCSessionDescriptionInit);
      }
      if (s.kind === "ice") {
        await handleIce(s.payload as RTCIceCandidateInit);
      }
      if (s.kind === "hangup") {
        endCall(false);
      }
    }
  }, [endCall, handleAnswer, handleIce, handleOffer, mode, roomId, token, whoami]);

  const startCall = useCallback(async () => {
    setStarting(true);
    setCallError(null);

    try {
      await startMedia();
      await ensurePeerConnection();
      await attachTracks();

      await postSignal("presence", { at: new Date().toISOString() });

      if (canInitiateOffer) {
        await createAndSendOffer();
      }

      setStarted(true);
      pollingRef.current = setInterval(() => {
        pollSignals().catch(() => {});
      }, 1000);

      pollSignals().catch(() => {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start call";
      setCallError(msg);
    }

    setStarting(false);
  }, [attachTracks, canInitiateOffer, createAndSendOffer, ensurePeerConnection, pollSignals, postSignal, startMedia]);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      setJoining(true);
      setJoinError(null);
      try {
        const res = await fetch(joinUrl);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to join");
        }
        if (cancelled) return;

        const jr = data as JoinResponse;
        setRoomId(jr.roomId);
        setWhoami(jr.whoami);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to join";
        if (!cancelled) setJoinError(msg);
      }
      if (!cancelled) setJoining(false);
    }

    join();

    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  useEffect(() => {
    return () => {
      endCall(false);
    };
  }, [endCall]);

  const toggleMic = useCallback(() => {
    const enabled = !micEnabled;
    setMicEnabled(enabled);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }, [micEnabled]);

  const toggleCam = useCallback(() => {
    const enabled = !camEnabled;
    setCamEnabled(enabled);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }, [camEnabled]);

  if (joining) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-white p-8 text-center">
        <div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Preparing video call…</p>
          <p className="mt-1 text-xs text-muted">Checking access and schedule.</p>
        </div>
      </div>
    );
  }

  if (joinError || !roomId || !whoami) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8">
        <p className="text-sm font-bold text-foreground">Unable to join video call</p>
        <p className="mt-1 text-sm text-muted">{joinError ?? "Missing room"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {callError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {callError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={localVideoRef}
            className="h-[260px] w-full object-cover opacity-95"
            autoPlay
            playsInline
            muted
          />
          <div className="flex items-center justify-between bg-white px-4 py-2">
            <p className="text-xs font-bold text-foreground">You ({whoami})</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className="rounded-lg border border-border bg-white p-2 text-muted hover:bg-muted-light"
                title={micEnabled ? "Mute" : "Unmute"}
              >
                {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleCam}
                className="rounded-lg border border-border bg-white p-2 text-muted hover:bg-muted-light"
                title={camEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {camEnabled ? <Camera className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            ref={remoteVideoRef}
            className="h-[260px] w-full object-cover"
            autoPlay
            playsInline
          />
          <div className="flex items-center justify-between bg-white px-4 py-2">
            <p className="text-xs font-bold text-foreground">Other party</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pollSignals().catch(() => {})}
                className="rounded-lg border border-border bg-white p-2 text-muted hover:bg-muted-light"
                title="Refresh"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {!started ? (
        <button
          type="button"
          onClick={() => {
            if (!starting) startCall().catch(() => {});
          }}
          disabled={starting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60"
        >
          {starting ? "Starting…" : "Start call"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => endCall(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          <PhoneOff className="h-4 w-4" /> End call
        </button>
      )}

      <p className="text-[11px] text-muted">
        This is v1 in-browser calling. If calls fail on some networks, we’ll add TURN support.
      </p>
    </div>
  );
}
