import type { DetailedHTMLProps, HTMLAttributes } from 'react'

// Custom element from @zoom/videosdk that hosts attached <video-player> elements.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'video-player-container': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
