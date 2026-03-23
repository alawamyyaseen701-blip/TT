'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function StorePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="store"
          title="المنتجات الرقمية"
          subtitle="قوالب، تطبيقات، متاجر إلكترونية — كل منتج رقمي جاهز للبيع"
          icon="🛒"
          color="16,185,129"
          emptyIcon="🛒"
        />
      </div>
      <Footer />
    </div>
  );
}
