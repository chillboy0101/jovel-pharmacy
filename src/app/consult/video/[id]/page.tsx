import VideoConsultationCall from "@/components/VideoConsultationCall";

export default async function ConsultationVideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Video Consultation</h1>
      <p className="mb-8 text-sm text-muted">
        Allow camera and microphone access to start.
      </p>

      <VideoConsultationCall consultationId={id} token={token} mode="client" />
    </div>
  );
}
