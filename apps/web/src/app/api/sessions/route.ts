import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@packages/model/db/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let targetUserId = session.user.id;
    const isGuest = (session.user as any).isGuest === true || targetUserId === "guest-jwt";
    
    if (isGuest) {
      // Fetch the real guest user's games from the DB
      const guestUser = await prisma.user.findUnique({
        where: { email: "guestuser@gmail.com" },
        select: { id: true },
      });
      if (guestUser) {
        targetUserId = guestUser.id;
      }
    }

    const sessions = await prisma.session.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        prompt: true,
        status: true,
        createdAt: true,
        plan: true,
      },
    });

    // Extract title from plan JSON if available
    const formatted = sessions.map((s) => ({
      id: s.id,
      prompt: s.prompt,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      plan: s.plan
        ? {
            title: (s.plan as Record<string, unknown>).title || null,
            description: (s.plan as Record<string, unknown>).description || null,
          }
        : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[/api/sessions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
