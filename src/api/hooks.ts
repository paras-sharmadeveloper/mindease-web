import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { del, get, patch, post, put } from './client'
import type { AppUserPage, SignupPeriod, EmailStatus, FocusArea, Availability, AvailabilityWindow, Booking, Dashboard, ProgramContent, ProgramDetail, ProgramStatus, ProgramSummary, Question, Questionnaire, Therapist, VideoToken } from './types'

export type BookingScope = 'upcoming' | 'past' | 'all'

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => get<Dashboard>('/panel/dashboard') })

export const useBookings = (scope: BookingScope, therapistId?: string) =>
  useQuery({
    queryKey: ['bookings', scope, therapistId ?? null],
    queryFn: () => get<Booking[]>(`/panel/bookings?${new URLSearchParams({ scope, ...(therapistId ? { therapistId } : {}) })}`),
    refetchInterval: scope === 'upcoming' ? 60_000 : false, // join buttons open on time
  })

/** Admin: app sign-ups, newest first, 25 per page. */
export const useAppUsers = (q: string, period: SignupPeriod, page: number) =>
  useQuery({
    queryKey: ['app-users', q, period, page],
    queryFn: () => get<AppUserPage>(`/panel/users?${new URLSearchParams({ q, period, page: String(page) })}`),
    placeholderData: keepPreviousData,
  })

export const useBooking = (id: string) => useQuery({ queryKey: ['booking', id], queryFn: () => get<Booking>(`/panel/bookings/${id}`) })

export const useFocusAreas = () =>
  useQuery({ queryKey: ['focus-areas'], queryFn: () => get<FocusArea[]>('/focus-areas'), staleTime: Infinity })

export const useTherapists = (enabled = true) =>
  useQuery({ queryKey: ['therapists'], queryFn: () => get<Therapist[]>('/panel/therapists'), enabled })

export const useTherapist = (id: string) => useQuery({ queryKey: ['therapist', id], queryFn: () => get<Therapist>(`/panel/therapists/${id}`) })

export const useAvailability = (id: string) =>
  useQuery({ queryKey: ['availability', id], queryFn: () => get<Availability>(`/panel/therapists/${id}/availability`) })

function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

export function useBookingAction() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, action, status }: { id: string; action: 'cancel' | 'outcome'; status?: 'completed' | 'no_show' }) =>
      post<Booking>(`/panel/bookings/${id}/${action}`, action === 'outcome' ? { status } : undefined),
    onSuccess: () => invalidate('bookings', 'booking', 'dashboard'),
  })
}

/** Therapist: remove cancelled sessions from their own list (the bookings themselves are kept). */
export function useDeleteBookings() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await del<null>(`/panel/bookings/${id}`)
    },
    onSuccess: () => invalidate('bookings', 'booking', 'dashboard'),
  })
}

export interface TherapistInput {
  name?: string
  email?: string
  password?: string
  bio?: string | null
  specialties?: string[]
  photoUrl?: string | null
  timezone?: string
  priceCents?: number | null
  active?: boolean
}

export function useCreateTherapist() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: TherapistInput) => post<Therapist>('/panel/therapists', input),
    onSuccess: () => invalidate('therapists', 'dashboard'),
  })
}

export function useUpdateTherapist(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: TherapistInput) => patch<Therapist>(`/panel/therapists/${id}`, input),
    onSuccess: () => invalidate('therapists', 'therapist', 'me', 'dashboard'),
  })
}

export function useSaveWindows(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (windows: AvailabilityWindow[]) => put<Availability>(`/panel/therapists/${id}/availability`, { windows }),
    onSuccess: () => invalidate('availability'),
  })
}

export function useBlockPeriod(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: { startsAt: string; endsAt: string; reason?: string }) => post<Availability>(`/panel/therapists/${id}/exceptions`, input),
    onSuccess: () => invalidate('availability'),
  })
}

export function useUnblockPeriod(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (exceptionId: number) => del<null>(`/panel/therapists/${id}/exceptions/${exceptionId}`),
    onSuccess: () => invalidate('availability'),
  })
}

export const useChangePassword = () =>
  useMutation({ mutationFn: (input: { currentPassword: string; password: string }) => put<null>('/panel/me/password', input) })

export const fetchVideoToken = (bookingId: string) => post<VideoToken>(`/panel/bookings/${bookingId}/video-token`)

// ---- Programs and questionnaire (admin). Saves are live in the app straight away. ----

export const usePrograms = () => useQuery({ queryKey: ['programs'], queryFn: () => get<ProgramSummary[]>('/panel/programs') })

export const useProgram = (id: string) => useQuery({ queryKey: ['program', id], queryFn: () => get<ProgramDetail>(`/panel/programs/${id}`) })

export interface ProgramDetailsInput {
  title?: string
  short?: string | null
  status?: ProgramStatus
  displayOrder?: number
  coverImage?: string | null
}

export function useUpdateProgram(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: ProgramDetailsInput) => patch<ProgramSummary>(`/panel/programs/${id}`, input),
    onSuccess: () => invalidate('programs', 'program'),
  })
}

export function useReplaceProgramContent(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (content: ProgramContent) => put<ProgramDetail>(`/panel/programs/${id}/content`, { content }),
    onSuccess: () => invalidate('programs', 'program'),
  })
}

export function useCreateProgram() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (content: ProgramContent) => post<ProgramDetail>('/panel/programs', { content }),
    onSuccess: () => invalidate('programs'),
  })
}

export const useQuestionnaire = () => useQuery({ queryKey: ['questionnaire'], queryFn: () => get<Questionnaire>('/panel/questionnaire') })

export function useSaveQuestionnaire() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (questions: Question[]) => put<Questionnaire>('/panel/questionnaire', { questions }),
    onSuccess: (data) => qc.setQueryData(['questionnaire'], data),
  })
}

// ---- Email delivery check (admin) ----

export const useEmailStatus = (enabled: boolean) =>
  useQuery({ queryKey: ['email-status'], queryFn: () => get<EmailStatus>('/panel/email'), enabled })

export function useSendTestEmail() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (to: string) => post<{ sent: true; to: string }>('/panel/email/test', { to }),
    onSettled: () => invalidate('email-status'),
  })
}
