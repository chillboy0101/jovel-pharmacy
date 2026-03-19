import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    let rest = parts.slice(uploadIdx + 1);
    if (rest[0]?.startsWith("v") && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
    if (rest.length === 0) return null;

    const joined = rest.join("/");
    return joined.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

async function cloudinaryDeleteByUrl(fileUrl: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary not configured");
  }

  const publicId = getCloudinaryPublicIdFromUrl(fileUrl);
  if (!publicId) {
    throw new Error("Could not derive Cloudinary public_id");
  }

  const isPdf = /\.pdf($|\?)/i.test(fileUrl);
  const resourceType = isPdf ? "raw" : "image";
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
  const res = await fetch(destroyUrl, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok || (data?.result && data.result !== "ok" && data.result !== "not found")) {
    throw new Error(data?.error?.message || "Cloudinary delete failed");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const item = await prisma.prescription.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes ?? undefined,
      },
    });
    return NextResponse.json(item);
  } catch (err) {
    console.error("[/api/prescriptions PATCH]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const rx = await prisma.prescription.findUnique({ where: { id } });
    if (!rx) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (rx.fileUrl) {
      try {
        await cloudinaryDeleteByUrl(rx.fileUrl);
      } catch (err) {
        console.error("[/api/prescriptions/[id] DELETE] Cloudinary delete failed", err);
        return NextResponse.json(
          { error: "Failed to delete prescription file" },
          { status: 500 },
        );
      }
    }

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/prescriptions/[id] DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
