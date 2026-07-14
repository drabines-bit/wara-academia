'use server'

import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database'

export type MyNotifications = {
  items: Notification[]
  unread: number
}

export async function getMyNotifications(): Promise<MyNotifications> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [], unread: 0 }

  const [{ data: items }, { count: unread }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null),
  ])

  return { items: (items as Notification[]) ?? [], unread: unread ?? 0 }
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)
}
