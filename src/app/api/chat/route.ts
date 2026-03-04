import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/chat?chatId=xxx — get messages for a chat
// GET /api/chat — admin: get all chats (grouped)
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; name: string; email: string } | undefined;
  
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SUPER_ADMIN auto-promotion for build account
  if (user.email === "admin@jovelpharmacy.com" && user.role !== "SUPER_ADMIN") {
    await prisma.user.update({
      where: { email: user.email },
      data: { role: "SUPER_ADMIN" }
    });
    user.role = "SUPER_ADMIN";
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PHARMACIST", "SUPPORT"].includes(user.role);

  try {
    if (chatId) {
      // Mark messages as read when an admin opens the chat
      if (isAdmin && chatId !== user.id) {
        await prisma.chatMessage.updateMany({
          where: { 
            chatId,
            isAdmin: false,
            isRead: false 
          },
          data: { isRead: true }
        });
      } else if (!isAdmin && chatId === user.id) {
        // Mark admin messages as read when the customer opens the chat
        await prisma.chatMessage.updateMany({
          where: { 
            chatId,
            isAdmin: true,
            isRead: false 
          },
          data: { isRead: true }
        });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { chatId },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(messages);
    }

    // Admin with no chatId: list all unique chats
    if (isAdmin) {
      const distinctChats = await prisma.chatMessage.groupBy({
        by: ["chatId"],
        _max: { createdAt: true },
        _count: { id: true },
        orderBy: { _max: { createdAt: "desc" } },
      });

      const chatSummaries = await Promise.all(
        distinctChats.map(async (c) => {
          const customer = await prisma.user.findUnique({
            where: { id: c.chatId },
            select: { name: true, email: true },
          });
          
          const lastMsg = await prisma.chatMessage.findFirst({
            where: { chatId: c.chatId },
            orderBy: { createdAt: "desc" },
            select: { 
              message: true, 
              createdAt: true, 
              isAdmin: true, 
              assignedToId: true,
              assignedTo: { select: { name: true, role: true, lastActiveAt: true } },
              user: { select: { name: true } } 
            },
          });

          const unreadCount = await prisma.chatMessage.count({
            where: {
              chatId: c.chatId,
              isAdmin: false,
              isRead: false
            }
          });

          return {
            chatId: c.chatId,
            userName: customer?.name ?? customer?.email ?? "Customer",
            lastMessage: lastMsg?.message ?? "",
            lastAt: lastMsg?.createdAt,
            lastSender: lastMsg?.isAdmin ? (lastMsg.user?.name || "Admin") : "Customer",
            messageCount: c._count.id,
            unreadCount,
            assignedTo: lastMsg?.assignedTo ? {
              id: lastMsg.assignedToId,
              name: lastMsg.assignedTo.name,
              role: lastMsg.assignedTo.role,
              isOnline: lastMsg.assignedTo.lastActiveAt ? (new Date().getTime() - new Date(lastMsg.assignedTo.lastActiveAt).getTime() < 60000) : false
            } : null,
          };
        }),
      );
      return NextResponse.json(chatSummaries);
    }

    // Regular user: their own chat
    const messages = await prisma.chatMessage.findMany({
      where: { chatId: user.id },
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
  const user = session?.user as { id: string; role: string; name: string; email: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Sign in to chat" }, { status: 401 });
  }

  // SUPER_ADMIN auto-promotion for build account
  if (user.email === "admin@jovelpharmacy.com" && user.role !== "SUPER_ADMIN") {
    await prisma.user.update({
      where: { email: user.email },
      data: { role: "SUPER_ADMIN" }
    });
    user.role = "SUPER_ADMIN";
  }

  const body = await req.json();
  const { message, chatId } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN", "PHARMACIST", "SUPPORT"].includes(user.role);

  // resolvedChatId is the customer's user ID
  const resolvedChatId = isAdmin ? chatId : user.id;

  if (!resolvedChatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  // Auto-assign chat if not already assigned
  if (isAdmin) {
    const existingMsg = await prisma.chatMessage.findFirst({
      where: { chatId: resolvedChatId, assignedToId: { not: null } },
    });
    
    if (!existingMsg) {
      // Assign this client to the first admin who responds
      await prisma.chatMessage.updateMany({
        where: { chatId: resolvedChatId },
        data: { assignedToId: user.id }
      });
    }
  }

  const msg = await prisma.chatMessage.create({
    data: {
      chatId: resolvedChatId,
      userId: user.id,
      message: message.trim(),
      isAdmin,
      isRead: false,
      assignedToId: isAdmin ? user.id : undefined // Use current admin for new msg
    },
    include: { user: { select: { name: true, role: true } } },
  });

  return NextResponse.json(msg, { status: 201 });
}
