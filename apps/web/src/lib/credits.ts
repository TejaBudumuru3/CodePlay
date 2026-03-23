import { prisma } from "@packages/model/db/client";

const USER_DAILY_CREDITS = 5;
const GUEST_DAILY_CREDITS = 2;

// Helper to check if a date is before today
function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export async function getCreditsInfo(userId?: string | null, deviceId?: string | null) {
  if (userId && userId !== "guest") {
    // If it's a real user ID
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    let { credits, lastCreditResetAt } = user;
    if (isBeforeToday(lastCreditResetAt)) {
      credits = USER_DAILY_CREDITS;
      user = await prisma.user.update({
        where: { id: userId },
        data: { credits, lastCreditResetAt: new Date() },
      });
    }

    return { credits, maxCredits: USER_DAILY_CREDITS, isGuest: false };
  }

  // Otherwise, it's a guest device
  if (!deviceId) return null;
  
  let guest = await prisma.guestDevice.findUnique({ where: { id: deviceId } });
  
  if (!guest) {
    // Treat first-time check as having max credits.
    // They will be inserted into DB upon first consumption.
    return { credits: GUEST_DAILY_CREDITS, maxCredits: GUEST_DAILY_CREDITS, isGuest: true };
  }

  let { credits, lastCreditResetAt } = guest;
  if (isBeforeToday(lastCreditResetAt)) {
    credits = GUEST_DAILY_CREDITS;
    guest = await prisma.guestDevice.update({
      where: { id: deviceId },
      data: { credits, lastCreditResetAt: new Date() },
    });
  }

  return { credits, maxCredits: GUEST_DAILY_CREDITS, isGuest: true };
}

export async function consumeCredit(userId?: string | null, deviceId?: string | null) {
  if (userId && userId !== "guest") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let { credits, lastCreditResetAt } = user;
    if (isBeforeToday(lastCreditResetAt)) {
      credits = USER_DAILY_CREDITS;
    }

    if (credits <= 0) {
      return { allowed: false, remaining: 0 };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: credits - 1, lastCreditResetAt: new Date() },
    });

    return { allowed: true, remaining: credits - 1 };
  }

  if (!deviceId) throw new Error("No device ID provided for guest");

  let guest = await prisma.guestDevice.findUnique({ where: { id: deviceId } });
  
  let credits = guest ? guest.credits : GUEST_DAILY_CREDITS;
  let lastCreditResetAt = guest ? guest.lastCreditResetAt : new Date();

  if (isBeforeToday(lastCreditResetAt)) {
    credits = GUEST_DAILY_CREDITS;
  }

  if (credits <= 0) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.guestDevice.upsert({
    where: { id: deviceId },
    update: { credits: credits - 1, lastCreditResetAt: new Date() },
    create: { id: deviceId, credits: credits - 1, lastCreditResetAt: new Date() },
  });

  return { allowed: true, remaining: credits - 1 };
}
