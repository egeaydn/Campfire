import Image from "next/image";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="relative flex flex-col items-center gap-6">
        <Image 
          src="/campfire-logo.svg" 
          alt="Campfire Logo" 
          width={100} 
          height={100}
          className="drop-shadow-2xl animate-pulse"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-campfire-light via-campfire-medium to-campfire-dark blur-3xl opacity-20 rounded-full" />
        <h1 className="text-6xl lg:text-8xl font-bold text-center relative">
          <span className="bg-gradient-to-r from-campfire-dark via-campfire-medium to-campfire-light bg-clip-text text-transparent">
            Campfire
          </span>
        </h1>
      </div>
      
      <p className="text-xl lg:text-2xl !leading-tight mx-auto max-w-2xl text-center text-muted-foreground">
        Connect, chat, and collaborate in real-time with your team.
        <br />
        <span className="text-campfire-medium font-semibold">Secure. Fast. Simple.</span>
      </p>

      <div className="flex gap-4">
        <a 
          href="/auth/sign-up"
          className="px-8 py-3 bg-gradient-to-r from-campfire-medium to-campfire-light text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          Get Started
        </a>
        <a 
          href="/auth/login"
          className="px-8 py-3 border-2 border-campfire-medium text-campfire-medium rounded-lg font-semibold hover:bg-campfire-medium hover:text-white transition-all duration-200"
        >
          Sign In
        </a>
      </div>
      
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-campfire-light to-transparent my-8" />
    </div>
  );
}
