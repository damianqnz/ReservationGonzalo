import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import SearchCard from "@/components/booking/SearchCard";
import TrustBadges from "@/components/sections/TrustBadges";
import FeaturedProperties from "@/components/sections/FeaturedProperties";
import WhyBookDirect from "@/components/sections/WhyBookDirect";
import GuestReviews from "@/components/sections/GuestReviews";
import Footer from "@/components/layout/Footer";

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
