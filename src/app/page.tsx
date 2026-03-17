import Navbar from "@/components/stitch/Navbar";
import Hero from "@/components/stitch/Hero";
import SearchCard from "@/components/stitch/SearchCard";
import TrustBadges from "@/components/stitch/TrustBadges";
import FeaturedProperties from "@/components/stitch/FeaturedProperties";
import WhyBookDirect from "@/components/stitch/WhyBookDirect";
import GuestReviews from "@/components/stitch/GuestReviews";
import Footer from "@/components/stitch/Footer";

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SearchCard />
        <TrustBadges />
        <FeaturedProperties />
        <WhyBookDirect />
        <GuestReviews />
      </main>
      <Footer />
    </div>
  );
}
