import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "./env-var-warning";
import { Suspense } from "react";
import { AuthButton } from "./auth-button";

export default function Navbar() {
    return(
        <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-7xl mx-auto flex justify-between items-center h-16 px-4">
            <div className="flex gap-6 items-center">
              <Link href={"/"} className="font-bold text-xl hover:text-primary transition-colors">
                Campfire
              </Link>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </header>
    )
}