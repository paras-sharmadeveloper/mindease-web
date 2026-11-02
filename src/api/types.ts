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
