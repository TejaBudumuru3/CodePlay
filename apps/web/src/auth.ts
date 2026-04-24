import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@packages/model/db/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // No PrismaAdapter — Credentials provider is incompatible with it in NextAuth v5 JWT mode.
  // User persistence is handled manually in the signIn callback below.
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/builder",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {
        name: { label: "Name", type: "text" }
      },
      async authorize(credentials) {
        // Return a static mock user object, no DB upsert to prevent spam
        return {
          id: "guest-jwt",
          email: "guest@example.com",
          name: (credentials?.name as string) || "Guest User",
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth — upsert the user in our DB manually (no adapter)
      if (account?.provider === "google" && profile?.email) {
        try {
          await prisma.user.upsert({
            where: { email: profile.email },
            update: {
              name: profile.name ?? undefined,
              image: (profile as Record<string, string>).picture ?? undefined,
            },
            create: {
              email: profile.email,
              name: profile.name ?? null,
              image: (profile as Record<string, string>).picture ?? null,
            },
          });
          // Fetch the DB user to get the real cuid ID into the token
          const dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
            select: { id: true },
          });
          if (dbUser) user.id = dbUser.id;
        } catch (err) {
          console.error("[Google signIn] DB error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
        // If it's the guest user, flag it in the token
        if (user.id === "guest-jwt") {
          token.isGuest = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      if (token.isGuest) {
        (session.user as any).isGuest = true;
      }
      return session;
    },
  },
});
