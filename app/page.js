import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Barbers from "@/components/landing/Barbers";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#080808]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <Hero />
        <Services />
        <Barbers />
        <Testimonials />
        <CTA />
      </main>
      <Footer className="mb-[72px] md:mb-0" />
    </div>
  );
}
