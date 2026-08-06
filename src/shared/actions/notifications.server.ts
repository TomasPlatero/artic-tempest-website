'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('No autorizado');

  const userId = (session.user as any).id;

  const { error } = await supabaseAdmin.from('user_notifications_read').upsert({
    user_id: userId,
    notification_id: notificationId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/zona-raider/notificaciones');
  revalidatePath('/notificaciones');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) throw new Error('No autorizado');

  const userId = (session.user as any).id;

  const { data: unreadNotifications } = await supabaseAdmin
    .from('system_notifications')
    .select('id');

  if (!unreadNotifications?.length) {
    return { success: true };
  }

  const inserts = unreadNotifications.map((n: any) => ({
    user_id: userId,
    notification_id: n.id,
  }));

  const { error } = await supabaseAdmin
    .from('user_notifications_read')
    .upsert(inserts);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/zona-raider/notificaciones');
  revalidatePath('/notificaciones');
  return { success: true };
}
