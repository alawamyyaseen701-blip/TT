'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function AuctionsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="auction"
          title="المزادات"
          subtitle="شارك في مزادات حصرية على أصول رقمية نادرة بأسعار منافسة"
          icon="🔨"
          color="249,115,22"
          emptyIcon="🔨"
        />
      </div>
      <Footer />
    </div>
  );
}
