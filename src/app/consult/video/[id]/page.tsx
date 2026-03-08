import ClientVideoTokenGate from "./ClientVideoTokenGate";

export default async function ConsultationVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Video Consultation</h1>
      <p className="mb-8 text-sm text-muted">
        Allow camera and microphone access to start.
      </p>

      <ClientVideoTokenGate consultationId={id} />
    </div>
  );
}
