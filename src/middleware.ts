import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

// 公開路由（不需要進入 auth 流程）
const publicRoutes = [
  "/login",
  "/api/auth",
  "/legal",
  "/listing/",
  "/request/",
  "/forum",
];

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;

  // 1. 快速過濾靜態資源與公開路由
  const isStaticFile = pathname.includes(".") && !pathname.endsWith(".html");
  const isPublicRoute = pathname === "/" || publicRoutes.some(route => pathname.startsWith(route));

  if (isStaticFile || isPublicRoute) {
    return NextResponse.next();
  }

  // 2. 非公開路由，auth 已自動注入 session
});

export const config = {
  // 匹配所有路由，但排除 API routes、_next/static、_next/image、favicon.ico
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
