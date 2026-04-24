import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@packages/model/db/client";
import { Controller } from "@packages/controller/index";
import { consumeCredit } from "@/lib/credits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { sessionId, message, prompt } = body as {
      sessionId?: string;
      message?: string;
      prompt?: string;
    };

    const isGuest = (session.user as any).isGuest === true || session.user.id === "guest-jwt";
    const actualUserId = isGuest ? null : userId;

    if (isGuest) {
      return NextResponse.json({ error: "Guests are not allowed to create games." }, { status: 403 });
    }

    // New game flow — create session and start
    if (!sessionId && prompt) {
      const creditStatus = await consumeCredit(actualUserId, isGuest);

      if (!creditStatus.allowed) {
        return NextResponse.json({ error: "Insufficient credits. Please try again tomorrow." }, { status: 403 });
      }

      const newSession = await prisma.session.create({
        data: {
          userId,
          prompt,
          status: "INIT",
        },
      });

      const controller = new Controller(newSession.id);
      const result = await controller.start();

      const response = NextResponse.json({
        type: result.type,
        data: result.data,
        sessionId: newSession.id,
      });

      return response;
    }

    // Existing game flow — continue session
    if (sessionId) {
      // Verify session belongs to user
      const existingSession = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });

      if (!existingSession || existingSession.userId !== userId) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const controller = new Controller(sessionId);
      const result = await controller.start(message);

      return NextResponse.json({
        type: result.type,
        data: result.data,
        sessionId,
      });
    }

    return NextResponse.json({ error: "Missing prompt or sessionId" }, { status: 400 });
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
