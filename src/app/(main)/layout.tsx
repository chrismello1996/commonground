import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden pb-14 sm:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
