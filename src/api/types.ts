export type Role = 'admin' | 'therapist' | 'user'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Therapist {
  id: string
  name: string
  email: string
  bio: string | null
  specialties: string[]
  photoUrl: string | null
  timezone: string
  priceCents: number
  customPrice: boolean
  currency: string
  sessionMinutes: number
  active: boolean
  createdAt: string
}

export interface Me {
  user: User
  role: Role
  therapist: Therapist | null
}

export interface AvailabilityWindow {
  weekday: number // 0 = Sunday
  start: string // "09:00"
  end: string
}

export interface BlockedPeriod {
  id: number
  startsAt: string
  endsAt: string
  reason: string | null
}

export interface Availability {
  therapistId: string
  timezone: string
  windows: AvailabilityWindow[]
  exceptions: BlockedPeriod[]
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Booking {
  id: string
  status: BookingStatus
  cancelReason: string | null
  startsAt: string
  endsAt: string
  client: { name: string; email: string }
  therapist: { id: string; name: string }
  priceCents: number
  currency: string
  notes: string | null
  /** What the client wants to focus on (their therapist only). */
  focus: FocusArea[]
  clientMobile: string | null
  payment: { status: string; amountCents: number; refundedCents: number } | null
  canCancel: boolean
  canMarkOutcome: boolean
  canJoin: boolean
  joinOpensAt: string | null
  createdAt: string
}

export interface Dashboard {
  upcoming: number
  next7Days: number
  completedLast30Days: number
  cancelledLast30Days: number
  activeTherapists: number | null
  totalUsers: number | null
  newUsersLast24Hours: number | null
  newUsersLast7Days: number | null
  newUsersLast30Days: number | null
}

export interface VideoToken {
  token: string
  sessionName: string
  userIdentity: string
  role: 'host' | 'participant'
  expiresAt: string
  displayName: string
}

export type ProgramStatus = 'active' | 'coming_soon' | 'hidden'

/** Admin view of a program. `content` (the full JSON the app receives) is only on the detail endpoint. */
export interface ProgramSummary {
  id: string
  title: string
  short: string | null
  status: ProgramStatus
  displayOrder: number
  coverImage: string | null
  contentVersion: string | null
  counts: { phases: number; lessons: number; videos: number; quizzes: number }
  updatedAt: string | null
}

export interface ProgramDetail extends ProgramSummary {
  content: ProgramContent
}

/** Only the parts of the app's program JSON the panel reads. Everything else is kept as is. */
export interface ProgramContent {
  id: string
  title: string
  phases: {
    id: string
    number?: number
    title: string
    description?: string
    lessons?: { id: string; title: string; minutes?: number }[]
    videos?: { id: string; title: string; duration: number; mediaUrl?: string | null }[]
    activity?: { id: string; title: string; prompts?: { id: string; q: string }[] } | null
    quiz?: { id: string; passThreshold?: number | null; questions: { id: string; q: string; options: string[]; answer: number }[] } | null
  }[]
  [key: string]: unknown
}

export type QuestionType = 'single' | 'multi' | 'mood'

export interface QuestionOption { v: string; label: string; [key: string]: unknown }

export interface Question {
  id: string
  type: QuestionType
  q: string
  options: QuestionOption[]
  exclusive?: string | null
  [key: string]: unknown
}

export interface Questionnaire {
  version?: string
  questions: Question[]
  updatedAt: string | null
  [key: string]: unknown
}

export interface EmailStatus {
  settings: {
    mailer: string
    host: string | null
    port: number | null
    encryption: string | null
    username: string | null
    fromAddress: string | null
    fromName: string | null
    sendsEmail: boolean
  }
  queue: {
    connection: string
    waiting: number | null
    oldestWaitingAt: string | null
    failed: number | null
    lastFailedAt: string | null
    lastError: string | null
  }
}

/** Focus areas: therapist specialties and the app's booking focus (GET /v1/focus-areas). */
export interface FocusArea {
  key: string
  label: string
}
