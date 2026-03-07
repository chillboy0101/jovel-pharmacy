"use client";

import VideoConsultationCall from "@/components/VideoConsultationCall";

export default function AdminConsultationVideoPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Consultation Video Call</h1>
      <p className="mb-8 text-sm text-muted">
        Start the call when you are ready. The client will join from their link.
      </p>

      <VideoConsultationCall consultationId={params.id} mode="staff" />
    </div>
  );
}
