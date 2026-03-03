import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/chat?chatId=xxx — get messages for a chat
// GET /api/chat — admin: get all chats (grouped)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const isAdmin = (session.user as { role: string }).role === "ADMIN";

  try {
    if (chatId) {
      const messages = await prisma.chatMessage.findMany({
        where: { chatId },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(messages);
    }

    // Admin with no chatId: list all unique chats
    if (isAdmin) {
      // Get distinct chatIds with latest message time
      const distinctChats = await prisma.chatMessage.groupBy({
        by: ["chatId"],
        _max: { createdAt: true },
        _count: { id: true },
        orderBy: { _max: { createdAt: "desc" } },
      });

      const chatSummaries = await Promise.all(
        distinctChats.map(async (c) => {
          // chatId is the customer's userId — look them up directly
          const customer = await prisma.user.findUnique({
            where: { id: c.chatId },
            select: { name: true, email: true },
          });
          const lastMsg = await prisma.chatMessage.findFirst({
            where: { chatId: c.chatId },
            orderBy: { createdAt: "desc" },
            select: { message: true, createdAt: true },
          });
          return {
            chatId: c.chatId,
            userName: customer?.name ?? customer?.email ?? "Customer",
            lastMessage: lastMsg?.message ?? "",
            lastAt: lastMsg?.createdAt,
            messageCount: c._count.id,
          };
        }),
      );
      return NextResponse.json(chatSummaries);
    }

    // Regular user: their own chat
    const messages = await prisma.chatMessage.findMany({
      where: { chatId: session.user.id as string },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (err) {
    console.error("[/api/chat GET]", err);
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 });
  }
}

// POST /api/chat — send a message
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to chat" }, { status: 401 });
  }

  const body = await req.json();
  const { message, chatId } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const isAdmin = (session.user as { role: string }).role === "ADMIN";

  // For regular users, chatId is always their own user ID
  // For admin, chatId is the customer's user ID they're replying to
  const resolvedChatId = isAdmin ? chatId : (session.user.id as string);

  if (!resolvedChatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      chatId: resolvedChatId,
      userId: session.user.id as string,
      message: message.trim(),
      isAdmin,
    },
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json(msg, { status: 201 });
}
