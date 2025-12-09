"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Logo & Title */}
      <div className="flex flex-col items-center gap-4 lg:hidden">
        <Image
          src="/campfire-logo.svg"
          alt="Campfire"
          width={64}
          height={64}
          className="drop-shadow-lg"
          unoptimized
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Login to your Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            See what is going on with your business
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-lg grid grid-cols-2 gap-1 p-1">
            <div className="bg-orange-500 rounded-sm" />
            <div className="bg-pink-500 rounded-sm" />
            <div className="bg-pink-500 rounded-sm" />
            <div className="bg-orange-500 rounded-sm" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Login to your Account</h1>
          <p className="text-sm text-muted-foreground mt-2">
            See what is going on with your business
          </p>
        </div>
      </div>
      {/* Login Card */}
      <Card className="border-none shadow-none">
        <CardContent className="pt-6">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@abc.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember Me
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Not Registered Yet?{" "}
            <Link
              href="/auth/sign-up"
              className="text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline font-medium"
            >
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
