import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCreditsInfo } from "@/lib/credits";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    // If guestuser@gmail.com, we treat them as guest
    if (session?.user?.email === "guestuser@gmail.com") {
      userId = undefined;
    }

    const deviceId = req.cookies.get("guest_device_id")?.value;

    const info = await getCreditsInfo(userId, deviceId);

    if (!info) {
      return NextResponse.json({ credits: 0, maxCredits: 0, error: "Unable to find credit info" }, { status: 400 });
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error("[/api/credits] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
