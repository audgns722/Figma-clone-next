"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ThreadData } from "@liveblocks/client";
import { Thread } from "@liveblocks/react-comments";

import { ThreadMetadata } from "@/liveblocks.config";

type Props = {
  thread: ThreadData<ThreadMetadata>;
  onFocus: (threadId: string) => void;
};

export const PinnedThread = ({ thread, onFocus, ...props }: Props) => {
  // 방금 생성된 고정 스레드가 열려 있도록 합니다.
  const startMinimized = useMemo(
    () => Number(new Date()) - Number(new Date(thread.createdAt)) > 100,
    [thread]
  );

  const [minimized, setMinimized] = useState(startMinimized);

  /**
   * 스레드가 변경될 때만 변경되도록 이 함수의 결과를 메모이제이션하여
   * 매 렌더링마다 변경되지 않도록 합니다.
   * useMemo는 성능 최적화를 위해 사용되며, 불필요한 리렌더링을 방지합니다.
   *
   * useMemo: https://react.dev/reference/react/useMemo
   */
  const memoizedContent = useMemo(
    () => (
      <div
        className='absolute flex cursor-pointer gap-4'
        {...props}
        onClick={(e: any) => {
          onFocus(thread.id);

          // 클릭이 작성기 위/내에서 발생했는지 확인합니다.
          if (
            e.target &&
            e.target.classList.contains("lb-icon") &&
            e.target.classList.contains("lb-button-icon")
          ) {
            return;
          }

          setMinimized(!minimized);
        }}
      >
        <div
          className='relative flex h-9 w-9 select-none items-center justify-center rounded-bl-full rounded-br-full rounded-tl-md rounded-tr-full bg-white shadow'
          data-draggable={true}
        >
          <Image
            src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
            alt='Dummy Name'
            width={28}
            height={28}
            draggable={false}
            className='rounded-full'
          />
        </div>
        {!minimized ? (
          <div className='flex min-w-60 flex-col overflow-hidden rounded-lg bg-white text-sm shadow'>
            <Thread
              thread={thread}
              indentCommentContent={false}
              onKeyUp={(e) => {
                e.stopPropagation();
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    [thread.comments.length, minimized]
  );

  return <>{memoizedContent}</>;
};
