import { prisma } from "@packages/model/db/client";

const USER_DAILY_CREDITS = 5;

// Helper to check if a date is before today
function isBeforeToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export async function getCreditsInfo(userId?: string | null, isGuest?: boolean) {
  if (isGuest || !userId || userId === "guest-jwt") {
    // Guests always have 0 credits
    return { credits: 0, maxCredits: 0, isGuest: true, tier: 'FREE' };
  }

  // If it's a real user ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  let { credits, lastCreditResetAt, tier } = user;
  if (isBeforeToday(lastCreditResetAt)) {
    credits = USER_DAILY_CREDITS;
    await prisma.user.update({
      where: { id: userId },
      data: { credits, lastCreditResetAt: new Date() },
    });
  }

  // Enforce a strict 5-credit limit for all users (even pro if required, or based on tier, but plan said 5 for all)
  return { credits, maxCredits: USER_DAILY_CREDITS, isGuest: false, tier };
}

export async function consumeCredit(userId?: string | null, isGuest?: boolean) {
  if (isGuest || !userId || userId === "guest-jwt") {
    return { allowed: false, remaining: 0 };
  }

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
