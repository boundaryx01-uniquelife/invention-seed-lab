/**
 * 로그인 보안이 해제되었으므로, 모든 서버 API 요청에 대해 관리자 권한 승인을 반환합니다.
 */
export async function verifyAdmin(): Promise<boolean> {
  return true;
}
