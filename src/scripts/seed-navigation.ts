const navigationData = {
  general: [
    {
      title: 'Inicio',
      url: '/dashboard',
      icon_name: 'IconDashboard',
      order_index: 0,
    },
    {
      title: 'Notificaciones',
      url: '/dashboard/notificaciones',
      icon_name: 'IconBell',
      badge_key: 'notifications',
      order_index: 1,
    },
    {
      title: 'Volver a la web',
      url: '/',
      icon_name: 'IconWorld',
      order_index: 2,
    },
    {
      title: 'Aplicación de Escritorio',
      url: 'https://github.com/your-repo/guildboard-desktop',
      icon_name: 'IconDesktop',
      app_id: 'desktop-app-cta',
      order_index: 3,
    },
  ],
  raider: [
    {
      title: 'Roster',
      url: '/dashboard/roster',
      icon_name: 'IconUsers',
      app_id: 'roster',
      order_index: 10,
    },
    {
      title: 'Calendario',
      url: '/dashboard/calendario',
      icon_name: 'IconCalendarEvent',
      app_id: 'calendar',
      order_index: 11,
    },
    {
      title: 'Lista de Deseos',
      url: '/dashboard/bis',
      icon_name: 'IconListCheck',
      app_id: 'bis',
      order_index: 12,
    },
    {
      title: 'Planificador',
      url: '/dashboard/planificador-cds',
      icon_name: 'IconTimeline',
      app_id: 'planificador-cds',
      order_index: 13,
    },
    {
      title: 'Estadísticas y Logs',
      url: '/dashboard/estadisticas',
      icon_name: 'IconChartBar',
      app_id: 'stats',
      order_index: 14,
    },
  ],
  admin: [
    {
      title: 'Reclutamiento',
      url: '/dashboard/configuracion/reclutamiento',
      icon_name: 'IconListSearch',
      app_id: 'settings-recruitment',
      badge_key: 'recruitment',
      order_index: 20,
    },
    {
      title: 'Gestión BiS',
      url: '/dashboard/bis/admin',
      icon_name: 'IconListCheck',
      app_id: 'bis-admin',
      order_index: 21,
    },
    {
      title: 'Ajustes',
      url: '/dashboard/configuracion',
      icon_name: 'IconAdjustments',
      app_id: 'settings',
      order_index: 22,
    },
  ],
};

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seed() {
  console.log('Seeding navigation items...');

  // Clear existing items to avoid duplicates
  await supabase
    .from('navigation_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  const categories = [
    { title: null, items: navigationData.general },
    { title: 'ZONA RAIDER', items: navigationData.raider },
    { title: 'ADMINISTRACIÓN', items: navigationData.admin },
  ];

  for (const cat of categories) {
    let parentId: string | null = null;

    if (cat.title) {
      const { data: parent } = await supabase
        .from('navigation_items')
        .insert({ name: cat.title, order_index: cat.items[0].order_index - 1 })
        .select()
        .single();
      parentId = parent?.id;
    }

    for (const item of cat.items) {
      await supabase.from('navigation_items').insert({
        name: item.title,
        url: item.url,
        icon_name: item.icon_name,
        app_id: (item as any).app_id,
        badge_key: (item as any).badge_key,
        parent_id: parentId,
        order_index: item.order_index,
      });
    }
  }

  console.log('Seeding completed!');
}

seed();
