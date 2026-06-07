import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

/**
 * 서버 사이드에서 HttpOnly 쿠키의 JWT 토큰을 검증해 어드민 권한 여부를 확인합니다.
 */
export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return false;

    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === "admin";
  } catch (err) {
    return false;
  }
}
