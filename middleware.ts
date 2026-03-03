import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret });

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
