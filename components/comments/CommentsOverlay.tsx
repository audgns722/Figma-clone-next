"use client";

import { useCallback, useRef } from "react";
import { ThreadData } from "@liveblocks/client";

import {
  ThreadMetadata,
  useEditThreadMetadata,
  useThreads,
  useUser,
} from "@/liveblocks.config";
import { useMaxZIndex } from "@/lib/useMaxZIndex";

import { PinnedThread } from "./PinnedThread";

type OverlayThreadProps = {
  thread: ThreadData<ThreadMetadata>;
  maxZIndex: number;
};

export const CommentsOverlay = () => {
  /**
   * 방 안의 스레드 목록을 가져오기 위해 useThreads 후크를 사용하고 있습니다.
   */
  const { threads } = useThreads();

  // 스레드의 최대 z-index를 가져옵니다.
  const maxZIndex = useMaxZIndex();

  return (
    <div>
      {threads
        .filter((thread) => !thread.metadata.resolved)
        .map((thread) => (
          <OverlayThread
            key={thread.id}
            thread={thread}
            maxZIndex={maxZIndex}
          />
        ))}
    </div>
  );
};

const OverlayThread = ({ thread, maxZIndex }: OverlayThreadProps) => {
  /**
   * 스레드의 메타데이터를 수정하기 위해 useEditThreadMetadata 후크를 사용하고 있습니다.
   */
  const editThreadMetadata = useEditThreadMetadata();

  /**
   * 스레드의 사용자 정보를 가져오기 위해 useUser 후크를 사용하고 있습니다.
   */
  const { isLoading } = useUser(thread.comments[0].userId);

  // 스레드 요소의 위치를 지정하기 위해 ref를 사용합니다.
  const threadRef = useRef<HTMLDivElement>(null);

  // 다른 스레드가 위에 있을 경우, 마지막으로 업데이트된 요소의 z-index를 증가시킵니다.
  const handleIncreaseZIndex = useCallback(() => {
    if (maxZIndex === thread.metadata.zIndex) {
      return;
    }

    // 방 안의 스레드 z-index를 업데이트합니다.
    editThreadMetadata({
      threadId: thread.id,
      metadata: {
        zIndex: maxZIndex + 1,
      },
    });
  }, [thread, editThreadMetadata, maxZIndex]);

  if (isLoading) {
    return null;
  }

  return (
    <div
      ref={threadRef}
      id={`thread-${thread.id}`}
      className='absolute left-0 top-0 flex gap-5'
      style={{
        transform: `translate(${thread.metadata.x}px, ${thread.metadata.y}px)`,
      }}
    >
      {/* 스레드를 렌더링합니다. */}
      <PinnedThread thread={thread} onFocus={handleIncreaseZIndex} />
    </div>
  );
};
