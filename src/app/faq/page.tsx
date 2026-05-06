import Navbar from "@/components/layout/Navbar";
import HelpFaq from "@/components/sections/HelpFaq";

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <HelpFaq />
      </div>
    </>
  );
}
