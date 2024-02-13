import { CursorChatProps, CursorMode } from "@/types/type";
import CursorSVG from "@/public/assets/CursorSVG";

const CursorChat = ({
  cursor,
  cursorState,
  setCursorState,
  updateMyPresence,
}: CursorChatProps) => {
  // 입력 필드 값이 변경될 때 호출되는 핸들러입니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateMyPresence({ message: e.target.value }); // 사용자의 현재 상태를 업데이트합니다.
    setCursorState({
      mode: CursorMode.Chat, // 채팅 모드로 설정합니다.
      previousMessage: null, // 이전 메시지를 null로 설정합니다.
      message: e.target.value, // 현재 메시지를 업데이트합니다.
    });
  };

  // 키보드 입력을 처리하는 핸들러입니다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Enter 키를 누르면
      setCursorState({
        mode: CursorMode.Chat, // 채팅 모드 유지
        previousMessage: cursorState.message, // 이전 메시지를 현재 메시지로 설정
        message: "", // 현재 메시지를 비웁니다.
      });
    } else if (e.key === "Escape") {
      // Escape 키를 누르면
      setCursorState({
        mode: CursorMode.Hidden, // 커서 모드를 숨김으로 설정합니다.
      });
    }
  };

  return (
    <div
      className='absolute left-0 top-0'
      style={{
        transform: `translateX(${cursor.x}px) translateY(${cursor.y}px)`, // 커서 위치에 따라 이동합니다.
      }}
    >
      {/* 커서 상태가 채팅 모드일 때 메시지 입력창을 표시합니다. */}
      {cursorState.mode === CursorMode.Chat && (
        <>
          {/* 사용자 정의 커서 모양 */}
          <CursorSVG color='#000' />

          <div
            className='absolute left-2 top-5 bg-blue-500 px-4 py-2 text-sm leading-relaxed text-white'
            onKeyUp={(e) => e.stopPropagation()} // 상위 요소로의 이벤트 전파를 중지합니다.
            style={{
              borderRadius: 20, // 테두리 둥글기 설정
            }}
          >
            {/* 이전 메시지가 있으면 입력창 위에 표시합니다. */}
            {cursorState.previousMessage && (
              <div>{cursorState.previousMessage}</div>
            )}
            <input
              className='z-10 w-60 border-none	bg-transparent text-white placeholder-blue-300 outline-none'
              autoFocus={true} // 컴포넌트 렌더링 시 자동으로 포커스를 맞춥니다.
              onChange={handleChange} // 입력 필드 값이 변경될 때 호출될 핸들러를 설정합니다.
              onKeyDown={handleKeyDown} // 키보드 입력을 처리할 핸들러를 설정합니다.
              placeholder={cursorState.previousMessage ? "" : "Say something…"} // 플레이스홀더 텍스트를 설정합니다.
              value={cursorState.message} // 입력 필드의 현재 값
              maxLength={50} // 최대 입력 길이를 제한합니다.
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CursorChat;
