import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCreditsInfo } from "@/lib/credits";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    let userId = session?.user?.id;
    let isGuest = (session?.user as any)?.isGuest === true || userId === "guest-jwt";

    const info = await getCreditsInfo(userId, isGuest);

    if (!info) {
      return NextResponse.json({ credits: 0, maxCredits: 0, error: "Unable to find credit info" }, { status: 400 });
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error("[/api/credits] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
