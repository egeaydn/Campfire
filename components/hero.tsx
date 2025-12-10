'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { MessageSquare, Users, Zap, Shield } from "lucide-react";

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-campfire-light/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-campfire-medium/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-campfire-dark/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Floating Particles */}
        {mounted && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-campfire-light/40 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${10 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="container max-w-6xl mx-auto px-4 flex flex-col items-center gap-16 relative z-10">
        {/* Logo & Title Section */}
        <div className="flex flex-col items-center gap-8 text-center animate-fade-in">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
            <Image 
              src="/campfire-logo.svg" 
              alt="Campfire Logo" 
              width={120} 
              height={120}
              className="relative drop-shadow-2xl animate-bounce-slow"
              priority
              unoptimized
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black">
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Campfire
              </span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground max-w-3xl">
              Where conversations spark and communities
              <span className="block mt-2 bg-gradient-to-r from-campfire-medium to-campfire-light bg-clip-text text-transparent font-bold">
                come alive 🔥
              </span>
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
          <a 
            href="/auth/sign-up"
            className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <Zap className="w-5 h-5 group-hover:animate-bounce" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          
          <a 
            href="/auth/login"
            className="group px-8 py-4 border-2 border-campfire-medium text-campfire-medium dark:text-campfire-light rounded-xl font-bold text-lg hover:bg-campfire-medium hover:text-white dark:hover:bg-campfire-light transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              Sign In
              <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </span>
          </a>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-8">
          {[
            { icon: MessageSquare, title: "Real-time Chat", desc: "Instant messaging" },
            { icon: Users, title: "Group Chats", desc: "Collaborate together" },
            { icon: Shield, title: "Secure", desc: "End-to-end encryption" },
            { icon: Zap, title: "Lightning Fast", desc: "Blazing performance" },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border hover:border-campfire-light transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-campfire-light/20 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <feature.icon className="w-10 h-10 mb-3 text-campfire-medium group-hover:text-campfire-light group-hover:scale-110 transition-all" />
              <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="flex flex-wrap justify-center gap-12 mt-8 text-center">
          {[
            { value: "10K+", label: "Active Users" },
            { value: "1M+", label: "Messages Sent" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat, i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="text-4xl font-black bg-gradient-to-r from-campfire-medium to-campfire-light bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
