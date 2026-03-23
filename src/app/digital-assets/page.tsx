'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function DigitalAssetsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="asset"
          title="الأصول الرقمية"
          subtitle="تداول المواقع والنطاقات والتطبيقات وكل الأصول الرقمية بأمان"
          icon="💎"
          color="37,99,235"
          emptyIcon="💎"
        />
      </div>
      <Footer />
    </div>
  );
}
