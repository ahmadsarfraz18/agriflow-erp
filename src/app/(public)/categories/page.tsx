import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    id: 'insecticide',
    name: 'Insecticides',
    description: 'Protect your crops from harmful insects, pests, and larvae with our range of systemic and contact insecticides.',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=500&fit=crop',
    products: [
      { name: 'Confidor 200 SL', brand: 'Bayer', usage: 'Sucking pests in cotton, vegetables' },
      { name: 'Karate 5 EC', brand: 'Syngenta', usage: 'Broad-spectrum pest control' },
      { name: 'Decis 10 EC', brand: 'Bayer', usage: 'Bollworm and fruit borer' },
      { name: 'Actara 25 WG', brand: 'Syngenta', usage: 'Thrips, aphids, jassids' },
      { name: 'Fastac 10 EC', brand: 'BASF', usage: 'Lepidopteran pests' },
    ],
  },
  {
    id: 'herbicide',
    name: 'Herbicides',
    description: 'Effective weed management solutions for pre-emergence and post-emergence control across all major crops.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=500&fit=crop',
    products: [
      { name: 'Roundup PowerMax', brand: 'Bayer', usage: 'Non-selective weed killer' },
      { name: 'Dual Gold 960 EC', brand: 'Syngenta', usage: 'Pre-emergence in corn' },
      { name: '2,4-D 40 SL', brand: 'Various', usage: 'Broadleaf weed control' },
      { name: 'Atlantis 3.6 WG', brand: 'Bayer', usage: 'Wheat weed control' },
      { name: 'Topik 15 EC', brand: 'BASF', usage: 'Grass weeds in broadleaf crops' },
    ],
  },
  {
    id: 'fungicide',
    name: 'Fungicides',
    description: 'Combat fungal diseases including rusts, blights, and mildews with preventive and curative solutions.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=500&fit=crop',
    products: [
      { name: 'Raxil 2 WS', brand: 'BASF', usage: 'Seed treatment' },
      { name: 'Score 25 EC', brand: 'Syngenta', usage: 'Powdery mildew, scab' },
      { name: 'Nativo 75 WG', brand: 'Bayer', usage: 'Wheat rust protection' },
      { name: 'Merpan 80 WDG', brand: 'Syngenta', usage: 'Leaf spot and blight' },
      { name: 'Impact 25 EC', brand: 'BASF', usage: 'Blast in rice' },
    ],
  },
  {
    id: 'fertilizer',
    name: 'Fertilizers',
    description: 'Premium quality fertilizers to maximize crop yield — from basic nitrogen to specialized NPK blends.',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=500&fit=crop',
    products: [
      { name: 'Urea 46%', brand: 'Engro', usage: 'High nitrogen source' },
      { name: 'DAP 18-46-00', brand: 'FFBL', usage: 'Phosphorus for root growth' },
      { name: 'NP 17-17-17', brand: 'Engro', usage: 'Balanced NPK' },
      { name: 'SOP 50%', brand: 'Various', usage: 'Potassium for fruit quality' },
      { name: 'Zinc Sulphate', brand: 'Various', usage: 'Micronutrient supplement' },
    ],
  },
  {
    id: 'pgr',
    name: 'Plant Growth Regulators',
    description: 'Control plant growth, prevent lodging, and improve crop uniformity with precision PGR solutions.',
    image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&h=500&fit=crop',
    products: [
      { name: 'Cycocel 750', brand: 'BASF', usage: 'Anti-lodging in wheat' },
      { name: 'Moddus 25 EC', brand: 'Syngenta', usage: 'Stress tolerance' },
      { name: 'Terpal 460 SL', brand: 'BASF', usage: 'Wheat height control' },
      { name: 'Ethrel 48 SL', brand: 'Syngenta', usage: 'Cotton defoliant' },
      { name: 'Funaben 50 WP', brand: 'Various', usage: 'Branching control' },
    ],
  },
];

export default function CategoriesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Product Categories</h1>
          <p className="text-lg text-green-100 max-w-2xl">
            Browse our comprehensive range of agrochemical products across all major categories. Quality products from trusted global brands.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {categories.map((category, idx) => (
            <div
              key={category.id}
              id={category.id}
              className={`flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image Side */}
              <div className="lg:w-[40%] relative h-64 lg:h-auto min-h-[320px]">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content Side */}
              <div className="lg:w-[60%] bg-gray-900 p-6 lg:p-10 flex flex-col justify-center">
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Category</span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">{category.name}</h2>
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">{category.description}</p>
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th className="px-4 py-2.5 text-left font-medium text-gray-300">Product</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-300">Brand</th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-300">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {category.products.map((product) => (
                        <tr key={product.name} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-white">{product.name}</td>
                          <td className="px-4 py-2.5 text-gray-400">{product.brand}</td>
                          <td className="px-4 py-2.5 text-gray-400">{product.usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help Choosing?</h2>
          <p className="text-gray-500 mb-8">
            Our technical team can help you select the right products for your specific crops and conditions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Contact Our Experts
          </Link>
        </div>
      </section>
    </div>
  );
}
