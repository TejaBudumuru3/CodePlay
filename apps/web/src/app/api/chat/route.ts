import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@packages/model/db/client";
import { Controller } from "@packages/controller/index";

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

    // New game flow — create session and start
    if (!sessionId && prompt) {
      // Guest mode: delete previous sessions to enforce single-slot
      // if (session.user.email === "guestuser@gmail.com") {
      //   await prisma.session.deleteMany({
      //     where: { userId },
      //   });
      // }

      const newSession = await prisma.session.create({
        data: {
          userId,
          prompt,
          status: "INIT",
        },
      });

      const controller = new Controller(newSession.id);
      const result = await controller.start();

      return NextResponse.json({
        type: result.type,
        data: result.data,
        sessionId: newSession.id,
      });
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
