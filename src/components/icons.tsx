// Stroke icons in the style of the MindEase design guide (24px grid, round caps).
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 20, strokeWidth = 2.2, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>{children}</svg>
  )
}

export const Check = (p: P) => <Svg strokeWidth={3} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const Cross = (p: P) => <Svg strokeWidth={3} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const Lock = (p: P) => <Svg strokeWidth={2.4} {...p}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 018 0v3" /></Svg>
export const ChevronLeft = (p: P) => <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>
export const Home = (p: P) => <Svg {...p}><path d="M4 11l8-7 8 7v8a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 014 19z" /></Svg>
export const Calendar = (p: P) => <Svg {...p}><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></Svg>
export const Users = (p: P) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></Svg>
export const Clock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
export const Settings = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Svg>
export const Edit = (p: P) => <Svg {...p}><path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Svg>
export const LogOut = (p: P) => <Svg {...p}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" /></Svg>
export const Menu = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
export const Eye = (p: P) => <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Svg>
export const EyeOff = (p: P) => <Svg {...p}><path d="M10 5.7A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.7 3.4M6.6 6.6A16.6 16.6 0 002.5 12s3.5 6.5 9.5 6.5a9.3 9.3 0 004.4-1.1M3 3l18 18M9.9 9.9a3 3 0 004.2 4.2" /></Svg>
export const Plus = (p: P) => <Svg strokeWidth={2.6} {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const Video = (p: P) => <Svg {...p}><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></Svg>
export const VideoOff = (p: P) => <Svg {...p}><path d="M3 3l18 18M16 16v-1.5M16 10.5l5-3v9M12.5 6H13a3 3 0 013 3v1.5M6 6a3 3 0 00-3 3v6a3 3 0 003 3h7" /></Svg>
export const Mic = (p: P) => <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></Svg>
export const MicOff = (p: P) => <Svg {...p}><path d="M3 3l18 18M9 9v2a3 3 0 005 2.2M15 9.5V6a3 3 0 00-5.8-1M18.5 11a6.5 6.5 0 01-1 3.4M5.5 11a6.5 6.5 0 009.8 5.6M12 17.5V21" /></Svg>
export const Phone = (p: P) => <Svg {...p}><path d="M4 15.5c4.5-4 11.5-4 16 0l-1.8 2.3a1.5 1.5 0 01-1.9.4l-2.1-1.1a1.5 1.5 0 01-.8-1.4v-1.4a12 12 0 00-2.8 0v1.4a1.5 1.5 0 01-.8 1.4l-2.1 1.1a1.5 1.5 0 01-1.9-.4z" /></Svg>
export const Book = (p: P) => <Svg {...p}><path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5zM20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5z" /></Svg>
export const ListChecks = (p: P) => <Svg {...p}><path d="M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5M11 7h9M11 13h9M11 19h9" /></Svg>
export const ArrowUp = (p: P) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
export const ArrowDown = (p: P) => <Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>
export const Trash = (p: P) => <Svg {...p}><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" /></Svg>
export const Search = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Svg>
export const Ban = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></Svg>
