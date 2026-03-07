import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const currentUser = session?.user as { id: string; role: string } | undefined;

  // Only Admin can change roles
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role } = await req.json();
    const { id: userId } = await context.params;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Prevent changing your own role to something lower if you're the only admin
    if (userId === currentUser.id && role !== "ADMIN") {
      // Optional: Check if other admins exist before allowing this
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("[/api/users/[id]/role PATCH]", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
