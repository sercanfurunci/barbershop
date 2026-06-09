import Navbar from "@/components/shared/Navbar";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata = {
  title: "Book Appointment — MAKAS",
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-[#080808] pb-[72px] md:pb-0">
      <Navbar />
      <BookingFlow />
    </div>
  );
}
