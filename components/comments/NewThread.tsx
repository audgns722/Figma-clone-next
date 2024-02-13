"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import * as Portal from "@radix-ui/react-portal";
import { ComposerSubmitComment } from "@liveblocks/react-comments/primitives";

import { useCreateThread } from "@/liveblocks.config";
import { useMaxZIndex } from "@/lib/useMaxZIndex";

import PinnedComposer from "./PinnedComposer";
import NewThreadCursor from "./NewThreadCursor";

type ComposerCoords = null | { x: number; y: number };

type Props = {
  children: ReactNode;
};

export const NewThread = ({ children }: Props) => {
  // 새로운 코멘트를 배치하는 상태를 추적합니다.
  const [creatingCommentState, setCreatingCommentState] = useState<
    "placing" | "placed" | "complete"
  >("complete");

  /**
   * 새로운 스레드를 생성하기 위해 useCreateThread 후크를 사용합니다.
   */
  const createThread = useCreateThread();

  // 스레드의 최대 z-index를 가져옵니다.
  const maxZIndex = useMaxZIndex();

  // 코멘트 에디터(라이브블록스 코멘트 에디터)의 좌표를 추적하기 위한 상태 설정
  const [composerCoords, setComposerCoords] = useState<ComposerCoords>(null);

  // 마지막 포인터 이벤트를 추적하기 위한 상태 설정
  const lastPointerEvent = useRef<PointerEvent>();

  // 사용자가 코멘트 에디터를 사용할 수 있는지 여부를 추적하기 위한 상태 설정
  const [allowUseComposer, setAllowUseComposer] = useState(false);
  const allowComposerRef = useRef(allowUseComposer);
  allowComposerRef.current = allowUseComposer;

  useEffect(() => {
    // 코멘트가 이미 배치되었다면 아무 것도 하지 않습니다.
    if (creatingCommentState === "complete") {
      return;
    }

    // 화면에 코멘트를 배치합니다.
    const newComment = (e: MouseEvent) => {
      e.preventDefault();

      // 이미 배치되었다면, 외부 클릭으로 코멘트 에디터를 닫습니다.
      if (creatingCommentState === "placed") {
        // 클릭 이벤트가 코멘트 에디터 위/내부에서 발생했는지 확인합니다.
        const isClickOnComposer = ((e as any)._savedComposedPath = e
          .composedPath()
          .some((el: any) => {
            return el.classList?.contains("lb-composer-editor-actions");
          }));

        // 클릭이 코멘트 에디터 내부에서 발생했다면 아무 것도 하지 않습니다.
        if (isClickOnComposer) {
          return;
        }

        // 클릭이 코멘트 에디터 외부에서 발생했다면 코멘트 에디터를 닫습니다.
        if (!isClickOnComposer) {
          setCreatingCommentState("complete");
          return;
        }
      }

      // 첫 클릭으로 코멘트 에디터를 배치합니다.
      setCreatingCommentState("placed");
      setComposerCoords({
        x: e.clientX,
        y: e.clientY,
      });
    };

    document.documentElement.addEventListener("click", newComment);

    return () => {
      document.documentElement.removeEventListener("click", newComment);
    };
  }, [creatingCommentState]);

  useEffect(() => {
    // 코멘트 에디터를 드래그하면 위치를 업데이트합니다.
    const handlePointerMove = (e: PointerEvent) => {
      // composedPath가 제거되는 문제를 방지합니다.
      (e as any)._savedComposedPath = e.composedPath();
      lastPointerEvent.current = e;
    };

    document.documentElement.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.documentElement.removeEventListener(
        "pointermove",
        handlePointerMove
      );
    };
  }, []);

  // 바디에서 마지막 클릭의 포인터 이벤트를 나중에 사용하기 위해 설정합니다.
  useEffect(() => {
    if (creatingCommentState !== "placing") {
      return;
    }

    const handlePointerDown = (e: PointerEvent) => {
      // 코멘트 에디터가 이미 배치되었다면 아무 것도 하지 않습니다.
      if (allowComposerRef.current) {
        return;
      }

      // composedPath가 제거되는 문제를 방지합니다.
      (e as any)._savedComposedPath = e.composedPath();
      lastPointerEvent.current = e;
      setAllowUseComposer(true);
    };

    // 오른쪽 클릭으로 배치 취소
    const handleContextMenu = (e: Event) => {
      if (creatingCommentState === "placing") {
        e.preventDefault();
        setCreatingCommentState("complete");
      }
    };

    document.documentElement.addEventListener("pointerdown", handlePointerDown);
    document.documentElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.documentElement.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      document.documentElement.removeEventListener(
        "contextmenu",
        handleContextMenu
      );
    };
  }, [creatingCommentState]);

  // 코멘트 제출 시, 스레드 생성 및 상태 초기화
  const handleComposerSubmit = useCallback(
    ({ body }: ComposerSubmitComment, event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // 캔버스 요소를 가져옵니다.
      const overlayPanel = document.querySelector("#canvas");

      // 코멘트 좌표나 마지막 포인터 이벤트가 없거나, 오버레이 패널이 없다면, 즉 사용자가 아직 클릭하지 않았다면 아무 것도 하지 않습니다.
      if (!composerCoords || !lastPointerEvent.current || !overlayPanel) {
        return;
      }

      // 캔버스의 왼쪽 상단을 기준으로 좌표를 설정합니다.
      const { top, left } = overlayPanel.getBoundingClientRect();
      const x = composerCoords.x - left;
      const y = composerCoords.y - top;

      // 코멘트 좌표와 커서 선택자를 사용하여 새 스레드를 생성합니다.
      createThread({
        body,
        metadata: {
          x,
          y,
          resolved: false,
          zIndex: maxZIndex + 1,
        },
      });

      setComposerCoords(null);
      setCreatingCommentState("complete");
      setAllowUseComposer(false);
    },
    [createThread, composerCoords, maxZIndex]
  );

  return (
    <>
      {/**
       * NewThread 컴포넌트의 자식들에 클릭 이벤트 리스너를 추가하기 위해 Slot을 사용합니다.
       *
       * Slot: https://www.radix-ui.com/primitives/docs/utilities/slot
       */}
      <Slot
        onClick={() =>
          setCreatingCommentState(
            creatingCommentState !== "complete" ? "complete" : "placing"
          )
        }
        style={{ opacity: creatingCommentState !== "complete" ? 0.7 : 1 }}
      >
        {children}
      </Slot>

      {/* 코멘트 좌표가 있고 코멘트를 배치하는 상태라면 코멘트 에디터를 렌더링합니다. */}
      {composerCoords && creatingCommentState === "placed" ? (
        /**
         * 코멘트 에디터를 NewThread 컴포넌트 외부에 렌더링하기 위해 Portal.Root를 사용합니다. 이는 z-index 문제를 피하기 위함입니다.
         *
         * Portal.Root: https://www.radix-ui.com/primitives/docs/utilities/portal
         */
        <Portal.Root
          className='absolute left-0 top-0'
          style={{
            pointerEvents: allowUseComposer ? "initial" : "none",
            transform: `translate(${composerCoords.x}px, ${composerCoords.y}px)`,
          }}
          data-hide-cursors
        >
          <PinnedComposer onComposerSubmit={handleComposerSubmit} />
        </Portal.Root>
      ) : null}

      {/* 코멘트를 배치하는 동안 사용자 정의 커서를 표시합니다. */}
      <NewThreadCursor display={creatingCommentState === "placing"} />
    </>
  );
};
