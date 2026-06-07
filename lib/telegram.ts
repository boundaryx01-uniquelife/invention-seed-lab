/**
 * Telegram Bot API를 활용해 알림 메시지를 전송합니다.
 * @param token 텔레그램 봇 토큰
 * @param chatId 메시지를 전송할 채팅방 ID
 * @param text 전송할 HTML 마크업 텍스트 메시지
 */
export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<boolean> {
  if (!token || !chatId || !text) {
    console.warn("Telegram Token, Chat ID, or text is missing. Skipping telegram notification.");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Telegram API error: status ${res.status}, body: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send telegram message:", error);
    return false;
  }
}
