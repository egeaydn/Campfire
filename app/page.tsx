import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Suspense fallback={<div className="w-full h-16 border-b border-b-foreground/10" />}>
          <Navbar />
        </Suspense>

        <Footer />
        
      </div>
    </main>
  );
}
