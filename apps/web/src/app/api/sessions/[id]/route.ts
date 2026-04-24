import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@packages/model/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    let isGuest = false;
    let targetUserId = session?.user?.id;
    
    if (session?.user) {
      isGuest = (session.user as any).isGuest === true || targetUserId === "guest-jwt";
    }

    if (!targetUserId && !isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isGuest) {
      const guestUser = await prisma.user.findUnique({
        where: { email: "guestuser@gmail.com" },
        select: { id: true },
      });
      if (guestUser) {
        targetUserId = guestUser.id;
      }
    }

    const gameSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!gameSession || gameSession.userId !== targetUserId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: gameSession.id,
      prompt: gameSession.prompt,
      status: gameSession.status,
      createdAt: gameSession.createdAt.toISOString(),
      clarification: gameSession.clarification,
      plan: gameSession.plan,
      code: gameSession.code,
      error: gameSession.error,
    });
  } catch (error) {
    console.error("[/api/sessions/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
