import Link from 'next/link';
import { FloatingChatWidget } from '@/components/chat-widget';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Categories', href: '/categories' },
  { name: 'Contact', href: '/contact' },
];

const productCategories = [
  { name: 'Insecticides', href: '/categories#insecticide' },
  { name: 'Herbicides', href: '/categories#herbicide' },
  { name: 'Fungicides', href: '/categories#fungicide' },
  { name: 'Fertilizers', href: '/categories#fertilizer' },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-lg">A</div>
            <span className="text-xl font-bold text-gray-900">AgriFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
            >
              ERP Login
            </Link>
            <Link
              href="/contact"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-lg">A</div>
                <span className="text-xl font-bold text-gray-900">AgriFlow</span>
              </div>
              <p className="text-sm text-gray-500">
                Pakistan&apos;s leading pesticide inventory, dealer management, and cash recovery platform.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Products</h3>
              <ul className="space-y-2">
                {productCategories.map((cat) => (
                  <li key={cat.name}>
                    <Link href={cat.href} className="text-sm text-gray-500 hover:text-green-600 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-green-600 transition-colors">Contact Us</Link></li>
                <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 transition-colors">ERP Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Office #12, Agri Market</li>
                <li>Lahore, Punjab, Pakistan</li>
                <li>+92 42 1234 5678</li>
                <li>info@agriflow.pk</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-400">
            © 2026 AgriFlow. All rights reserved. | Developed with ❤️ by <span className="font-bold text-green-600">Mahar Ahmad Sarfraz</span>
          </div>
        </div>
      </footer>

      <FloatingChatWidget />
    </div>
  );
}
