import React from 'react';
import SponsoredProducts from './ads/SponsoredProducts';

export default function FeaturedMarketplaceProducts() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SponsoredProducts 
          placement="homepage_featured" 
          title="Featured Marketplace Products"
          subtitle="Premium promoted listings from our verified manufacturers"
          limit={6}
        />
      </div>
    </section>
  );
}
