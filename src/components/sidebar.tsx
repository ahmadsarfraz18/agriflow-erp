'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Dealers', href: '/dealers' },
  { name: 'Recovery', href: '/recovery' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">AgriFlow ERP</h1>
        <p className="text-sm text-gray-400">Pesticide Management</p>
      </div>
      
      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'block px-4 py-2 rounded-lg transition-colors',
              pathname === item.href
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}