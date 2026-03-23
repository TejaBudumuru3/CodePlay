import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCreditsInfo } from "@/lib/credits";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    // If guestuser@gmail.com, we treat them as guest
    if (session?.user?.email === "guestuser@gmail.com") {
      userId = undefined;
    }

    const deviceIdCookie = req.cookies.get("guest_device_id")?.value;
    let deviceId = deviceIdCookie;
    let newDeviceId = false;

    if (userId === undefined && !deviceId) {
      deviceId = crypto.randomUUID();
      newDeviceId = true;
    }

    const info = await getCreditsInfo(userId, deviceId);

    if (!info) {
      return NextResponse.json({ credits: 0, maxCredits: 0, error: "Unable to find credit info" }, { status: 400 });
    }

    const response = NextResponse.json(info);
    
    if (newDeviceId && deviceId) {
      response.cookies.set("guest_device_id", deviceId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, path: "/" });
    }

    return response;
  } catch (error) {
    console.error("[/api/credits] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
