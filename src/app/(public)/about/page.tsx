import Navbar from "@/shared/components/layout/Navbar";
import AboutUs from "@/shared/components/marketing/AboutUs";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <AboutUs />
      </div>
    </>
  );
}
