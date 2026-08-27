import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    title: 'Batch & Expiry Tracking',
    description: 'FIFO-based stock management with real-time expiry alerts. Never sell expired products again.',
    icon: '📦',
  },
  {
    title: 'Dealer Khata (Ledger)',
    description: 'Complete credit management with digital khata, payment history, and automated balance tracking.',
    icon: '📒',
  },
  {
    title: 'Cash Recovery',
    description: 'Field recovery tracking with aging analysis, overdue alerts, and payment collection management.',
    icon: '💰',
  },
  {
    title: 'AI Assistant',
    description: 'Natural language queries for inventory, dealer info, and recovery status. Ask anything in English or Urdu.',
    icon: '🤖',
  },
  {
    title: 'Real-time Dashboard',
    description: 'KPIs at a glance — inventory value, receivables, expiring batches, and today\'s collections.',
    icon: '📊',
  },
  {
    title: 'Multi-zone Management',
    description: 'Manage dealers across different zones with area-wise reporting and recovery tracking.',
    icon: '🗺️',
  },
];

const products = [
  {
    name: 'Confidor 200 SL',
    brand: 'Bayer',
    category: 'Insecticide',
    description: 'Systemic insecticide for control of sucking pests in cotton, vegetables, and rice.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop',
  },
  {
    name: 'Roundup PowerMax',
    brand: 'Bayer',
    category: 'Herbicide',
    description: 'Non-selective herbicide for weed control in orchards, field borders, and fallow land.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
  },
  {
    name: 'Raxil 2 WS',
    brand: 'BASF',
    category: 'Fungicide',
    description: 'Seed treatment fungicide for control of seed-borne and soil-borne diseases.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop',
  },
  {
    name: 'Urea 46%',
    brand: 'Engro',
    category: 'Fertilizer',
    description: 'High-nitrogen fertilizer for boosting crop growth during vegetative stage.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop',
  },
  {
    name: 'Cycocel 750',
    brand: 'BASF',
    category: 'PGR',
    description: 'Plant growth regulator for controlling lodging in wheat and cotton.',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=300&fit=crop',
  },
  {
    name: 'Karate 5 EC',
    brand: 'Syngenta',
    category: 'Insecticide',
    description: 'Broad-spectrum pyrethroid insecticide for cotton, vegetable, and fruit crops.',
    image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=400&h=300&fit=crop',
  },
];

const stats = [
  { value: '500+', label: 'Active Dealers' },
  { value: '10K+', label: 'Products Tracked' },
  { value: '₨2B+', label: 'Recoveries Managed' },
  { value: '99.9%', label: 'Uptime' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&h=1080&fit=crop"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Smart Pesticide Management for Modern Pakistan
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">
              Inventory tracking, dealer khata management, and cash recovery — all in one powerful platform built for agrochemical distributors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-green-700 shadow-sm hover:bg-green-50 transition-colors"
              >
                Open ERP Dashboard
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-green-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Distribution Business
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From inventory to recovery, AgriFlow handles it all with powerful tools designed specifically for the Pakistani agrochemical market.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <p className="text-lg text-gray-500">
                Trusted brands from leading agrochemical manufacturers
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden md:inline-flex items-center text-green-600 font-medium hover:text-green-700"
            >
              View All Categories →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.name}
                className="group rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {product.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Digitize Your Distribution Business?
          </h2>
          <p className="text-lg text-green-100 mb-8">
            Join hundreds of distributors already using AgriFlow to manage inventory, track dealer payments, and recover cash faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-green-700 shadow-sm hover:bg-green-50 transition-colors"
            >
              Get Started Today
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
