import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { EnvVarWarning } from "./env-var-warning";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";
import { Shield, User, Settings, MessageSquare, Search, Plus } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewConversationModal } from "./chat/NewConversationModal";

export default async function Navbar() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    // Get user profile if logged in
    let profile = null;
    if (user?.sub) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.sub)
        .single();
      profile = profileData;
    }

    // Check if user is admin
    let isAdmin = false;
    if (user?.sub) {
      const { data: adminCheck } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.sub)
        .single();
      isAdmin = !!adminCheck;
    }

    return(
        <nav className="w-full border-b-2 border-campfire-light/30 bg-gradient-to-r from-campfire-dark via-campfire-medium to-campfire-dark shadow-lg sticky top-0 z-50">
          <div className="container max-w-7xl mx-auto flex justify-between items-center h-20 px-6">
            <div className="flex gap-8 items-center flex-1">
              <Link href="/explore" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Keşfet
              </Link>
              <Link href="/categories" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Kategoriler
              </Link>
              <Link href="/about" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
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
                  className="w-32 h-32 drop-shadow-2xl"
                  unoptimized
                />
              </Link>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : user ? (
                <>
                  <NewConversationModal>
                    <Button size="sm" className="bg-campfire-light hover:bg-campfire-medium text-white">
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline ml-2">New</span>
                    </Button>
                  </NewConversationModal>

                  <Button asChild size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                    <Link href="/search" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <span className="hidden md:inline">Search</span>
                    </Link>
                  </Button>

                  <Button asChild size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                    <Link href="/" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden md:inline">Messages</span>
                    </Link>
                  </Button>

                  <ThemeSwitcher />

                  {isAdmin && (
                    <Button asChild size="sm" className="border-2 border-white/30 text-white hover:bg-white/10">
                      <Link href="/admin" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden md:inline">Admin</span>
                      </Link>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                        <Avatar className="h-10 w-10 border-2 border-campfire-light">
                          <AvatarImage src={profile?.avatar_url || ""} alt={profile?.username || "User"} />
                          <AvatarFallback className="bg-campfire-light text-white">
                            {profile?.username?.slice(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-card border-campfire-light">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-campfire-dark">{profile?.username || "User"}</p>
                          <p className="text-xs text-campfire-medium">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <LogoutButton />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant={"ghost"} className="text-white/80 hover:text-white hover:bg-white/10">
                    <Link href="/auth/login">Giriş Yap</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-campfire-light hover:bg-campfire-medium text-white">
                    <Link href="/auth/sign-up">Kayıt Ol</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
    )
}