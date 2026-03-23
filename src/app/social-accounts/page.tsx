'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingsBrowser from '@/components/ListingsBrowser';

export default function SocialAccountsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ paddingTop: 72, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ListingsBrowser
          type="social"
          title="حسابات سوشيال ميديا"
          subtitle="اشترِ وبع حسابات YouTube, Instagram, TikTok وغيرها بأمان عبر نظام Escrow"
          icon="📱"
          color="16,185,129"
          emptyIcon="📱"
        />
      </div>
      <Footer />
    </div>
  );
}
