import Navbar from "@/components/layout/Navbar";
import AboutUs from "@/components/sections/AboutUs";

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
