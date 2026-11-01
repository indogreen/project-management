export type PermissionKey =
  | 'project-view'
  | 'activity-view'
  | 'mitra-view'
  | 'bc-view'
  | 'certificate-view'
  | 'finance-view'
  | 'category-view'
  | 'item-view'
  | 'warehouse-view'
  | 'stock-movement-view';

export type NavItem = {
  href: string;
  label: string;
  icon: string;
  routePrefix?: string;
  permission?: PermissionKey;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Beranda',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        routePrefix: 'dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
      }
    ]
  },
  {
    label: 'Project',
    items: [
      {
        href: '/projects',
        label: 'Project',
        routePrefix: 'projects',
        permission: 'project-view',
        icon: 'M9 17v-2m3 2v-4m3 2v-6m2 9H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        href: '/activities',
        label: 'Activity',
        routePrefix: 'activities',
        permission: 'activity-view',
        icon: 'M8 7V3m8 4V3m-9 8h.01M17 11h.01M9 15h.01M15 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        href: '/mitras',
        label: 'Mitra',
        routePrefix: 'mitras',
        permission: 'mitra-view',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2m2-9l4-4m-4 4l4 4m6 0h9m-9 0a3 3 0 110-6m0 6a3 3 0 100-6'
      }
    ]
  },
  {
    label: 'Keuangan',
    items: [
      {
        href: '/finance',
        label: 'Finance',
        routePrefix: 'finance',
        permission: 'finance-view',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    ]
  },
  {
    label: 'Gudang',
    items: [
      {
        href: '/categories',
        label: 'Kategori',
        routePrefix: 'categories',
        permission: 'category-view',
        icon: 'M7 7h.01M3 11l8.5 8.5a2.121 2.121 0 003 0L21 13V3H11L3 11z'
      },
      {
        href: '/items',
        label: 'Item',
        routePrefix: 'items',
        permission: 'item-view',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
      },
      {
        href: '/warehouses',
        label: 'Gudang',
        routePrefix: 'warehouses',
        permission: 'warehouse-view',
        icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01'
      },
      {
        href: '/stock-movements',
        label: 'Mutasi Stok',
        routePrefix: 'stock-movements',
        permission: 'stock-movement-view',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4'
      }
    ]
  },
  {
    label: 'Sertifikat',
    items: [
      {
        href: '/barang-certificates',
        label: 'Barang Sertifikat',
        routePrefix: 'barang-certificates',
        permission: 'bc-view',
        icon: 'M9 2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 19.5V8.25L13.5 2.25H9zM9 12h6m-6 4h3'
      },
      {
        href: '/certificates',
        label: 'Sertifikat',
        routePrefix: 'certificates',
        permission: 'certificate-view',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    ]
  }
  // {
  // 	label: 'Sistem',
  // 	items: [
  // 		{
  // 			href: '/settings',
  // 			label: 'Pengaturan',
  // 			routePrefix: 'settings',
  // 			icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z'
  // 		}
  // 	]
  // }
];

const DETAIL_TITLES = [
  { prefix: '/projects/', title: 'Detail Project' },
  { prefix: '/activities/', title: 'Detail Activity' },
  { prefix: '/mitras/', title: 'Detail Mitra' },
  { prefix: '/barang-certificates/', title: 'Detail Barang Sertifikat' },
  { prefix: '/certificates/', title: 'Detail Sertifikat' },
  { prefix: '/stock-movements/', title: 'Mutasi Stok' },
  { prefix: '/settings/', title: 'Pengaturan' }
];

const PAGE_TITLES = new Map<string, string>(
  NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => [item.href, item.label] as [string, string])
  )
);

export function canShowNavItem(item: NavItem, permissions: string[]): boolean {
  return !item.permission || permissions.includes(item.permission);
}

export function getVisibleNavGroups(permissions: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canShowNavItem(item, permissions))
  })).filter((group) => group.items.length > 0);
}

export function getPageTitle(pathname: string): string {
  for (const item of DETAIL_TITLES) {
    if (pathname.startsWith(item.prefix)) return item.title;
  }

  return PAGE_TITLES.get(pathname) ?? 'Dashboard';
}

const DETAIL_PARENTS: Array<{ prefix: string; parentHref: string }> = [
  { prefix: '/barang-certificates/', parentHref: '/barang-certificates' },
  { prefix: '/certificates/', parentHref: '/certificates' },
  { prefix: '/projects/', parentHref: '/projects' },
  { prefix: '/activities/', parentHref: '/activities' },
  { prefix: '/mitras/', parentHref: '/mitras' }
];

/**
 * Mengembalikan rute induk untuk halaman detail jika pathname cocok.
 * Mengembalikan null jika bukan halaman detail.
 */
export function getDetailParentHref(pathname: string): string | null {
  for (const item of DETAIL_PARENTS) {
    if (pathname.startsWith(item.prefix)) {
      const remainder = pathname.slice(item.prefix.length).trim();
      if (remainder.length > 0) {
        return item.parentHref;
      }
    }
  }
  return null;
}
