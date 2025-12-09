import { SignUpForm } from "@/components/sign-up-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Sol taraf - Sign Up Form */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </div>

      {/* Sağ taraf - İllustrasyon */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-pink-100 via-amber-50 to-orange-100 p-8">
        <div className="absolute inset-0 bg-[url('/campfire-pattern.svg')] opacity-10" />
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/campfire-logo.svg"
              alt="Campfire"
              width={120}
              height={120}
              className="drop-shadow-2xl animate-pulse"
              priority
              unoptimized
            />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
            Join our community today!
          </h1>
          
          <p className="text-xl text-gray-700">
            Connect with people around the world and start meaningful conversations
          </p>

          {/* Decorative elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-pink-400 to-orange-400 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-3xl opacity-30" />
        </div>
      </div>
    </div>
  );
}
