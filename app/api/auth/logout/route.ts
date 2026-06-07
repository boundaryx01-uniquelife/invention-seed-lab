import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "로그아웃 되었습니다." });
  
  // 쿠키 만료 처리
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
