import { createBrowserClient } from "@supabase/ssr";
import { createMockClient } from "./mock-client";

export function createClient() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_CLIENT === "true") {
    return createMockClient();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
