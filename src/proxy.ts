import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("userRole")?.value;

  // Role-to-allowed-paths map
  const allowedPaths: Record<string, string[]> = {
    CUSTOMER: ["/dashboard"],
    DOCTOR: ["/doctor"],
    PHARMACY_OWNER: ["/pharmacy"],
    PHARMACY_STAFF: ["/staff", "/pharmacy"], // Staff can access BOTH
    SUPER_ADMIN: ["/admin"],
  };

  const protectedPaths = ["/dashboard", "/doctor", "/pharmacy", "/staff", "/admin"];

  for (const path of protectedPaths) {
    if (pathname.startsWith(path)) {
      // Not logged in
      if (!role) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Check if role has access to this path
      const roleAccess = allowedPaths[role];
      if (roleAccess) {
        const hasAccess = roleAccess.some(allowed => pathname.startsWith(allowed));
        if (!hasAccess) {
          // Redirect to first allowed path
          return NextResponse.redirect(new URL(roleAccess[0], request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/doctor/:path*", "/pharmacy/:path*", "/staff/:path*", "/admin/:path*"],
};
