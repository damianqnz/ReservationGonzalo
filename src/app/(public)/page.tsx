import Navbar from "@/shared/components/layout/Navbar";
import Hero from "@/shared/components/marketing/Hero";
import SearchCard from "@/shared/components/marketing/SearchCard";
import TrustBadges from "@/shared/components/marketing/TrustBadges";
import FeaturedProperties from "@/shared/components/marketing/FeaturedProperties";
import WhyBookDirect from "@/shared/components/marketing/WhyBookDirect";
import GuestReviews from "@/domains/review/components/GuestReviews";
import Footer from "@/shared/components/layout/Footer";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SearchCard />
        <FeaturedProperties />
        <TrustBadges />
        <WhyBookDirect />
        <GuestReviews />
      </main>
      <Footer />
    </div>
  );
}
