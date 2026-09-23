import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { writeAuditLog } from "@/lib/security/audit";
import { getPermissionsForRole, isStaffRole } from "@/lib/auth/permissions";

export type AppRole = Role;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: AppRole;
      permissions: string[];
    };
  }
  interface User {
    role: AppRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    permissions?: string[];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/login",
    error: "/account/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const ip = request ? clientIp(new Headers(request.headers)) : "unknown";
        const rl = rateLimit(`auth:${ip}:${parsed.data.email}`, 8, 60_000);
        if (!rl.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          await writeAuditLog({
            action: "auth.login_failed",
            entity: "User",
            entityId: user.id,
            ip,
          });
          return null;
        }
        await writeAuditLog({
          userId: user.id,
          action: "auth.login",
          entity: "User",
          entityId: user.id,
          ip,
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (isStaffRole(user.role)) {
          token.permissions = await getPermissionsForRole(user.role);
        } else {
          token.permissions = [];
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as AppRole) ?? "CUSTOMER";
        session.user.permissions = token.permissions ?? [];
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
