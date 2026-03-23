import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@packages/model/db/client";
import { Controller } from "@packages/controller/index";
import { consumeCredit } from "@/lib/credits";
import crypto from "crypto";

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

    const isGuest = session.user.email === "guestuser@gmail.com";
    const actualUserId = isGuest ? null : userId;
    let deviceId = req.cookies.get("guest_device_id")?.value;
    let newDeviceId = false;

    if (isGuest && !deviceId) {
      deviceId = crypto.randomUUID();
      newDeviceId = true;
    }

    // New game flow — create session and start
    if (!sessionId && prompt) {
      const creditStatus = await consumeCredit(actualUserId, deviceId);
      
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

      if (newDeviceId && deviceId) {
        response.cookies.set("guest_device_id", deviceId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true });
      }

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
