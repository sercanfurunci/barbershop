import Navbar from "@/components/shared/Navbar";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata = {
  title: "Book Appointment — MAKAS",
};

export default function BookPage() {
  return (
    <div style={{ background: "#F6F3EE", minHeight: "100vh" }}>
      <Navbar />
      <BookingFlow />
    </div>
  );
}
