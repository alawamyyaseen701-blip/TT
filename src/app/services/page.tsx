'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function ServicesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="service"
          title="الخدمات"
          subtitle="خدمات تصميم، برمجة، تسويق وأكثر — من محترفين موثوقين"
          icon="⚡"
          color="239,68,68"
          emptyIcon="⚡"
        />
      </div>
      <Footer />
    </div>
  );
}
