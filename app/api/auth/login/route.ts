import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";

    if (password === adminPassword) {
      // 7일간 유효한 토큰 생성
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
      
      const response = NextResponse.json(
        { success: true, message: "로그인 성공" },
        { status: 200 }
      );
      
      // HttpOnly 쿠키 설정
      response.cookies.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7일 (초 단위)
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("로그인 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
