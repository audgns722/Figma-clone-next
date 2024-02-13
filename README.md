# DesignWarp

DesignWarp은 실시간 협업이 가능한 디자인 툴 입니다. Next.js 프레임워크를 기반으로 하며, 실시간 캔버스 작업, 코멘트 기능, 사용자 간의 실시간 커서 공유 등 다양한 기능을 제공합니다. 프로젝트 구축을 위해 필요한 주요 라이브러리와 그 설치 방법을 아래에 정리했습니다.

### 사이트를 두개 켜 동시 협업 기능을 채험 하실 수 있습니다.

## 시작하기

```
npm install
npm run dev
```

## 라이브러리 설치

프로젝트를 시작하기 위한 기본적인 Next.js 애플리케이션 생성 및 필수 라이브러리 설치 명령어입니다.

```
npx create-next-app@latest ./
npm install fabric uuid
npm install @liveblocks/client @liveblocks/react
npx create-liveblocks-app@latest --init --framework react (yes)
npx shadcn-ui@latest init (Default / Slate / yes)
npm install @liveblocks/react-comments
```

이 명령어들은 다음과 같은 기능을 위해 필요한 패키지들을 설치합니다.

    - fabric: 캔버스 기반의 그래픽 작업을 위한 JavaScript 라이브러리입니다.
    - uuid: 고유 식별자(UUID)를 생성합니다.
    - @liveblocks/client 및 @liveblocks/react: 실시간 협업 기능을 위한 Liveblocks 클라이언트입니다.
    - @liveblocks/react-comments: 실시간 코멘트 기능을 위한 Liveblocks 라이브러리입니다.
    - Shadcn UI: 사용자 인터페이스를 구축하기 위한 UI 컴포넌트 라이브러리입니다.

## 기능소개

DesignWarp 프로젝트는 다음과 같은 주요 기능을 포함합니다.

- 실시간 캔버스 협업: 사용자는 캔버스 위에서 동시에 그림을 그리고, 수정할 수 있습니다.
  코멘트 시스템: 사용자는 실시간으로 코멘트를 남기고, 의견을 공유할 수 있습니다.
- 커서 공유: 사용자들의 커서 위치가 실시간으로 공유되어, 협업 시 다른 사용자의 활동을 쉽게 파악할 수 있습니다.
- 반응 및 상호작용: 사용자는 캔버스 위의 특정 요소에 대해 반응을 남기거나, 다양한 상호작용을 할 수 있습니다.
- UI 컴포넌트: Shadcn UI를 통해 제공되는 다양한 UI 컴포넌트를 사용하여, 사용자 경험을 향상시킬 수 있습니다.
