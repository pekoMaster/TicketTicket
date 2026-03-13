import { auth } from "@/auth";
import { NextResponse } from "next/server";

// 公開路由（不需要進入 auth 流程）
const publicRoutes = [
  "/login",
  "/api/auth",
  "/legal",
];

export default function middleware(req: any) {
  const { pathname } = req.nextUrl;

  // 1. 快速過濾靜態資源與公開路由
  const isStaticFile = pathname.includes(".") && !pathname.endsWith(".html");
  const isPublicRoute = pathname === "/" || publicRoutes.some(route => pathname.startsWith(route));

  if (isStaticFile || isPublicRoute) {
    return NextResponse.next();
  }

  // 2. 只有非公開路由才進入 NextAuth 認證流程
  return auth(req);
}

export const config = {
  // 匹配所有路由，但排除 API routes、_next/static、_next/image、favicon.ico
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
