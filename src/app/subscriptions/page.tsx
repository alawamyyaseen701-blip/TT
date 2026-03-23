'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function SubscriptionsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="subscription"
          title="الاشتراكات"
          subtitle="اشتراكات Netflix, Spotify, ChatGPT وغيرها من المنصات العالمية"
          icon="⭐"
          color="245,158,11"
          emptyIcon="⭐"
        />
      </div>
      <Footer />
    </div>
  );
}
