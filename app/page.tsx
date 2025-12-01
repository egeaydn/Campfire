import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { SearchBar } from "@/components/search/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="w-full h-16 border-b border-b-foreground/10" />}>
        <Navbar />
      </Suspense>

      <div className="flex-1 container max-w-4xl mx-auto p-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Welcome to Campfire</h1>
            <p className="text-muted-foreground">
              Start a conversation by searching for users
            </p>
          </div>

          <SearchBar />
        </div>
      </div>

      <Footer />
    </main>
  );
}
