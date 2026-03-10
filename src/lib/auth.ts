import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

async function getUserVerificationFlags(userId: string) {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      'SELECT "emailVerified", "verifyToken" FROM "User" WHERE id = $1 LIMIT 1',
      userId,
    )) as Array<{ emailVerified: Date | null; verifyToken: string | null }>;
    const row = rows?.[0];
    return {
      supported: true as const,
      emailVerified: row?.emailVerified ?? null,
      verifyToken: row?.verifyToken ?? null,
    };
  } catch {
    return { supported: false as const, emailVerified: null, verifyToken: null };
  }
}

// Helper to check if a role is an admin role
export const isAdminRole = (role?: string) => {
  return ["ADMIN", "PHARMACIST", "SUPPORT"].includes(role || "");
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        let user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
          },
        });

        if (!user) return null;

        if (user?.email === "admin@jovelpharmacy.com" && user.role !== "ADMIN") {
          user = await prisma.user.update({
            where: { email: user.email },
            data: {
              role: "ADMIN",
              name: "Victoria Oluwakemi Akai Quartey",
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              password: true,
            },
          });
        }

        if (!user?.password) return null;

        const flags = await getUserVerificationFlags(user.id);
        if (flags.supported) {
          if (!flags.emailVerified && flags.verifyToken) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
        }

        const valid = await bcrypt.compare(
          password,
          user.password,
        );
        
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role: string }).role = token.role as string;
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
});
