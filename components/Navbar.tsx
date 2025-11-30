import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "./env-var-warning";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";
import Image from "next/image";

export default async function Navbar() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    return(
        <nav className="w-full border-b border-border/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container max-w-7xl mx-auto flex justify-between items-center h-20 px-6">
            <div className="flex gap-8 items-center flex-1">
              <Link href="/explore" className="text-sm font-medium hover:text-primary transition-colors">
                Keşfet
              </Link>
              <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                Kategoriler
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
                Hakkında
              </Link>
            </div>

            <div className="flex items-center justify-center">
              <Link href={"/"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image 
                  src="/campfire-logo.png" 
                  alt="Campfire" 
                  width={140} 
                  height={140}
                  quality={100}
                  priority
                  className="w-32 h-32"
                  unoptimized
                />
              </Link>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : user ? (
                <>
                  <ThemeSwitcher />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{user.email}</span>
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant={"ghost"}>
                    <Link href="/auth/login">Giriş Yap</Link>
                  </Button>
                  <Button asChild size="sm" variant={"default"}>
                    <Link href="/auth/sign-up">Kayıt Ol</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
    )
}