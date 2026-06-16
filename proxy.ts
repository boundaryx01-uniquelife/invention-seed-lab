import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. 비로그인 상태로 관리자용 페이지에 접근하는 경우 -> /login 으로 리다이렉트
  if (!token && !pathname.startsWith("/login") && !pathname.startsWith("/api") && pathname !== "/favicon.ico") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. 이미 로그인된 상태에서 로그인 페이지(/login)에 진입하려는 경우 -> 대시보드(/)로 리다이렉트
  if (token && pathname.startsWith("/login")) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정 (정적 파일 및 이미지 캐시 등은 제외)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/logout).*)",
  ],
};
