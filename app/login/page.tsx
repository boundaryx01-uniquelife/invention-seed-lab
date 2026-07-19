import { redirect } from "next/navigation";

export default function LoginPage() {
  // 로그인 페이지(/login)에 접근 시 0초 만에 무조건 대시보드(/)로 리다이렉트 (비밀번호 절차 소멸)
  redirect("/");
}
