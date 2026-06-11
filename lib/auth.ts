import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { recordAudit } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ipAddress =
          request?.headers?.get("x-forwarded-for") ??
          request?.headers?.get("x-real-ip") ??
          "unknown";
        const userAgent = request?.headers?.get("user-agent") ?? "unknown";

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.isActive) {
          await recordAudit({
            action: "LOGIN_FAILED",
            metadata: { email: parsed.data.email, reason: "user_not_found" },
            ipAddress,
            userAgent,
          });
          return null;
        }

        const passwordMatch = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatch) {
          await recordAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            metadata: { reason: "invalid_password" },
            ipAddress,
            userAgent,
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await recordAudit({
          userId: user.id,
          action: "LOGIN",
          ipAddress,
          userAgent,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      if (token?.id) {
        await recordAudit({
          userId: token.id as string,
          action: "LOGOUT",
        });
      }
    },
  },
});
