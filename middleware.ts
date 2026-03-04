import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// All possible NextAuth session cookie names across v4/v5, http/https
const COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  let token = null;
  for (const cookieName of COOKIE_NAMES) {
    if (req.cookies.has(cookieName)) {
      token = await getToken({ req, secret, cookieName });
      if (token) break;
    }
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
    
    // Use the helper logic to allow all staff roles
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "PHARMACIST", "SUPPORT"];
    if (!allowedRoles.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
