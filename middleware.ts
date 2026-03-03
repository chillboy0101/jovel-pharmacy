import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  // NextAuth v5 uses "authjs.session-token" in production (https) and
  // "__Secure-authjs.session-token" behind a proxy. Try both cookie names.
  const secureCookie = req.nextUrl.protocol === "https:";
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  let token = await getToken({ req, secret, cookieName });

  // Fallback: try the v4 cookie name in case of mixed deployments
  if (!token) {
    token = await getToken({
      req,
      secret,
      cookieName: secureCookie
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
    });
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/account", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", req.url));
    }
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
