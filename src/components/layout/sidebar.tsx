'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderTree, Tags, Barcode,
  Upload, ClipboardList, BookTemplate, LogOut, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/masters',    label: 'Masters',      icon: FolderTree },
  { href: '/categories', label: 'Categories',   icon: Tags },
  { href: '/variants',   label: 'Variants',     icon: ChevronRight },
  { href: '/skus',       label: 'SKU Generator',icon: Barcode },
  { href: '/catalog',    label: 'SKU Catalog',  icon: ClipboardList },
  { href: '/import',     label: 'Import',       icon: Upload },
  { href: '/templates',  label: 'Templates',    icon: BookTemplate },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-gray-100 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-100 px-5">
        <span className="text-sm font-semibold tracking-tight text-gray-900">SKU Engine</span>
        <span className="ml-2 rounded-full bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">v2</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-gray-950 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-[10px] text-gray-400">{user.role}</p>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
