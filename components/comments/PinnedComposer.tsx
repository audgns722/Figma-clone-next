"use client";

import Image from "next/image";
import { Composer, ComposerProps } from "@liveblocks/react-comments";

type Props = {
  onComposerSubmit: ComposerProps["onComposerSubmit"];
};

const PinnedComposer = ({ onComposerSubmit, ...props }: Props) => {
  return (
    <div className='absolute flex gap-4' {...props}>
      <div className='relative flex h-9 w-9 select-none items-center justify-center rounded-bl-full rounded-br-full rounded-tl-md rounded-tr-full bg-white shadow'>
        <Image
          src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
          alt='someone'
          width={28}
          height={28}
          className='rounded-full'
        />
      </div>
      <div className='flex min-w-96 flex-col overflow-hidden rounded-lg bg-white p-2 text-sm shadow'>
        {/**
         * 새 코멘트를 생성하기 위해 Composer 컴포넌트를 사용하고 있습니다.
         * Liveblocks는 코멘트를 생성/편집/삭제할 수 있는 Composer 컴포넌트를 제공합니다.
         *
         * Composer: https://liveblocks.io/docs/api-reference/liveblocks-react-comments#Composer
         */}
        <Composer
          onComposerSubmit={onComposerSubmit}
          autoFocus={true}
          onKeyUp={(e) => {
            e.stopPropagation();
          }}
        />
      </div>
    </div>
  );
};

export default PinnedComposer;
