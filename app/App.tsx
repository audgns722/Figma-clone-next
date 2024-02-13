"use client";

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectMoving,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasZoom,
  handlePathCreated,
  handleResize,
  initializeFabric,
  renderCanvas,
} from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { LeftSidebar, Live, Navbar, RightSidebar } from "@/components/index";
import { handleImageUpload } from "@/lib/shapes";
import { defaultNavElement } from "@/constants";
import { ActiveElement, Attributes } from "@/types/type";

const Home = () => {
  // useUndo와 useRedo는 Liveblocks에서 제공하는 후크로, 변화를 실행 취소하고 다시 실행할 수 있습니다.
  const undo = useUndo();
  const redo = useRedo();

  // useStorage는 Liveblocks에서 제공하는 후크로, 다른 사용자와 자동으로 동기화되는 키-값 저장소에 데이터를 저장할 수 있습니다.
  // 여기서는 캔버스 객체를 키-값 저장소에 저장합니다.
  const canvasObjects = useStorage((root) => root.canvasObjects);

  // canvasRef는 fabric 캔버스를 초기화할 때 사용할 캔버스 요소에 대한 참조입니다.
  // fabricRef는 캔버스 이벤트 리스너 외부에서 캔버스에 대한 작업을 수행하기 위해 사용하는 fabric 캔버스에 대한 참조입니다.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  // isDrawing은 사용자가 캔버스에 그리고 있는지 여부를 나타내는 불리언입니다.
  const isDrawing = useRef(false);

  // shapeRef는 사용자가 현재 그리고 있는 도형에 대한 참조입니다.
  const shapeRef = useRef<fabric.Object | null>(null);

  // selectedShapeRef는 사용자가 선택한 도형에 대한 참조입니다.
  const selectedShapeRef = useRef<string | null>(null);

  // activeObjectRef는 캔버스에서 활성/선택된 객체에 대한 참조입니다.
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const isEditingRef = useRef(false);

  // imageInputRef는 캔버스에 이미지를 업로드하기 위해 사용하는 입력 요소에 대한 참조입니다.
  const imageInputRef = useRef<HTMLInputElement>(null);

  // activeElement는 네비게이션 바에서 활성 요소의 이름, 값, 아이콘을 포함하는 객체입니다.
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  // elementAttributes는 캔버스에서 선택된 요소의 속성을 포함하는 객체입니다.
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  // deleteShapeFromStorage는 Liveblocks의 키-값 저장소에서 도형을 삭제하는 변형입니다.
  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  // deleteAllShapes는 Liveblocks의 키-값 저장소에서 모든 도형을 삭제하는 변형입니다.
  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get("canvasObjects");
    if (!canvasObjects || canvasObjects.size === 0) return true;

    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    return canvasObjects.size === 0;
  }, []);

  // syncShapeInStorage는 사용자가 캔버스에서 어떤 작업을 수행할 때마다 키-값 저장소에서 도형을 동기화하는 변형입니다.
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;
    const { objectId } = object;

    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.set(objectId, shapeData);
  }, []);

  /**
   * 네비게이션 바에서 활성 요소를 설정하고 선택된 요소에 따라 동작을 수행합니다.
   *
   * @param elem 활성화할 요소
   */
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      // 캔버스에서 모든 도형 삭제
      case "reset":
        // 저장소 클리어
        deleteAllShapes();
        // 캔버스 클리어
        fabricRef.current?.clear();
        // 활성 요소를 "select"로 설정
        setActiveElement(defaultNavElement);
        break;

      // 캔버스에서 선택된 도형 삭제
      case "delete":
        // 캔버스에서 삭제
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        // 활성 요소를 "select"로 설정
        setActiveElement(defaultNavElement);
        break;

      // 캔버스에 이미지 업로드
      case "image":
        // 파일 대화 상자를 여는 입력 요소의 클릭 이벤트 트리거
        imageInputRef.current?.click();
        /**
         * 사용자가 캔버스에 그리기 모드인 경우, 드롭다운에서 이미지 항목을 클릭할 때
         * 그리기 모드를 중지합니다.
         */
        isDrawing.current = false;

        if (fabricRef.current) {
          // 캔버스의 그리기 모드 비활성화
          fabricRef.current.isDrawingMode = false;
        }
        break;

      // 댓글에 대해서는 아무 동작도 수행하지 않음
      case "comments":
        break;

      default:
        // 선택된 요소를 선택된 도형으로 설정
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  useEffect(() => {
    // fabric 캔버스 초기화
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });

    /**
     * 사용자가 캔버스를 클릭할 때 발생하는 mouse:down 이벤트에 대한 리스너를 등록합니다.
     *
     * 이벤트 검사기: http://fabricjs.com/events
     * 이벤트 목록: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    /**
     * 사용자가 캔버스 위에서 마우스를 움직일 때 발생하는 mouse:move 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
      });
    });

    /**
     * 사용자가 마우스를 놓을 때 발생하는 mouse:up 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
      });
    });

    /**
     * 사용자가 자유형 그리기 모드를 사용하여 캔버스에 경로를 생성할 때 발생하는 path:created 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("path:created", (options) => {
      handlePathCreated({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * 사용자가 캔버스 위의 객체를 수정할 때 발생하는 object:modified 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * 사용자가 캔버스 위의 객체를 이동할 때 발생하는 object:moving 이벤트에 대한 리스너를 등록합니다.
     */
    canvas?.on("object:moving", (options) => {
      handleCanvasObjectMoving({
        options,
      });
    });

    /**
     * 사용자가 캔버스 위의 객체를 선택할 때 발생하는 selection:created 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    /**
     * 사용자가 캔버스 위의 객체를 스케일링할 때 발생하는 object:scaling 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("object:scaling", (options) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    /**
     * 사용자가 캔버스 위에서 마우스 휠을 스크롤할 때 발생하는 mouse:wheel 이벤트에 대한 리스너를 등록합니다.
     */
    canvas.on("mouse:wheel", (options) => {
      handleCanvasZoom({
        options,
        canvas,
      });
    });

    /**
     * 사용자가 창 크기를 조정할 때 발생하는 resize 이벤트에 대한 리스너를 등록합니다.
     */
    window.addEventListener("resize", () => {
      handleResize({
        canvas: fabricRef.current,
      });
    });

    /**
     * 사용자가 키보드를 누를 때 발생하는 keydown 이벤트에 대한 리스너를 등록합니다.
     */
    window.addEventListener("keydown", (e) =>
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    );

    // 컴포넌트가 언마운트될 때 캔버스를 정리하고 이벤트 리스너를 제거합니다.
    return () => {
      canvas.dispose();
      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  return (
    <main className='h-screen overflow-hidden'>
      <Navbar
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        handleImageUpload={(e: any) => {
          e.stopPropagation();
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        handleActiveElement={handleActiveElement}
      />

      <section className='flex h-full flex-row'>
        <LeftSidebar allShapes={Array.from(canvasObjects)} />

        <Live canvasRef={canvasRef} undo={undo} redo={redo} />

        <RightSidebar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
};

export default Home;
