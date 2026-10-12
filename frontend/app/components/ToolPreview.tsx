import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from 'react'
import { BuilderBackground } from '@/components'
import type { Tool } from '@shared/types'

export interface ToolPreviewHandle<T> {
  postMessage: (message: T) => void
}

type Props<MessageToIframe, MessageFromIframe> = PropsWithChildren<{
  tool: Tool
  onMessage: (message: MessageFromIframe) => void
  ref: RefObject<ToolPreviewHandle<MessageToIframe> | null>
  mockup?: boolean
  iframeSizeDesktop?: { width: number; height: number }
}>

export function ToolPreview<MessageToIframe, MessageFromIframe>({
  tool,
  onMessage,
  ref,
  mockup,
  iframeSizeDesktop,
  children,
}: Props<MessageToIframe, MessageFromIframe>) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const desktopWidth =
    iframeSizeDesktop?.width ??
    (tool === 'widget' ? IFRAME_WIDTH_WIDGET : IFRAME_WIDTH_DESKTOP)
  const desktopHeight =
    iframeSizeDesktop?.height ??
    (tool === 'widget' ? IFRAME_HEIGHT_WIDGET : IFRAME_HEIGHT_DESKTOP)

  const [iframeSize, setIframeSize] = useState({
    width: desktopWidth,
    height: desktopHeight,
  })

  const updateScreenMode = (isDesktop: boolean) => {
    setIframeSize({
      width: isDesktop ? desktopWidth : IFRAME_WIDTH_MOBILE,
      height: isDesktop ? desktopHeight : IFRAME_HEIGHT_MOBILE,
    })
  }

  useImperativeHandle(ref, () => {
    return {
      postMessage(message) {
        iframeRef.current!.contentWindow!.postMessage(message, location.origin)
      },
    }
  }, [])

  useEffect(() => {
    const listener = (ev: MediaQueryListEvent) => {
      updateScreenMode(ev.matches)
    }
    const media = window.matchMedia(TOGGLE_MEDIA_QUERY)
    updateScreenMode(media.matches)
    media.addEventListener('change', listener)
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [desktopWidth, desktopHeight])

  useEffect(() => {
    const resizePreview = () => {
      const containerWidth = containerRef.current!.offsetWidth
      const scaleFactor = containerWidth / iframeSize.width
      iframeRef.current!.style.setProperty('--scale', scaleFactor.toString())
    }
    resizePreview()
    window.addEventListener('resize', resizePreview)
    return () => {
      window.removeEventListener('resize', resizePreview)
    }
  }, [iframeSize.width])

  useEffect(() => {
    const messageHandler = (ev: MessageEvent<MessageFromIframe>) => {
      if (ev.origin !== location.origin) return
      onMessage(ev.data)
    }
    window.addEventListener('message', messageHandler)
    return () => {
      window.removeEventListener('message', messageHandler)
    }
  }, [onMessage])

  return (
    <BuilderBackground
      iframeMode={true}
      actions={children}
      mockup={mockup ?? tool !== 'widget'}
    >
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: `${iframeSize.width}/${iframeSize.height}` }}
        ref={containerRef}
      >
        <iframe
          ref={iframeRef}
          src={`/tools/${tool}/preview`}
          className="absolute top-0 left-0 origin-top-left border-none"
          style={{
            width: iframeSize.width + 'px',
            height: iframeSize.height + 'px',
            transform: 'scale(var(--scale, 0.5))',
          }}
        ></iframe>
      </div>
    </BuilderBackground>
  )
}

const IFRAME_WIDTH_DESKTOP = 860
const IFRAME_HEIGHT_DESKTOP = 720

const IFRAME_WIDTH_WIDGET = 540
const IFRAME_HEIGHT_WIDGET = 640

const IFRAME_WIDTH_MOBILE = 380
const IFRAME_HEIGHT_MOBILE = 600

const TOGGLE_MEDIA_QUERY = '(min-width: 34rem)'
