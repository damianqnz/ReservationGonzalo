import Navbar from "@/shared/components/layout/Navbar";
import HelpFaq from "@/shared/components/marketing/HelpFaq";

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
