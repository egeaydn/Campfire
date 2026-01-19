
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Mock data store
const mockUsers = new Map();
const mockSessions = new Map();

export const createMockClient = () => {
  console.log("⚠️ Using Mock Supabase Client");

  return {
    auth: {
      getSession: async () => {
        return { data: { session: null }, error: null };
      },
      getUser: async () => {
        return { data: { user: null }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        console.log("Mock signInWithPassword", email);
        return { data: { user: { id: "mock-user-id", email } }, error: null };
      },
      signUp: async ({ email, password, options }: any) => {
        console.log("Mock signUp", email);
        return { data: { user: { id: "mock-user-id", email } }, error: null };
      },
      signOut: async () => {
        console.log("Mock signOut");
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: (table: string) => {
      console.log(`Mock from(${table})`);
      return {
        select: (columns?: string) => {
            console.log(`Mock select(${columns})`);
            return {
                eq: (column: string, value: any) => {
                    console.log(`Mock eq(${column}, ${value})`);
                     return {
                        single: async () => {
                             return { data: null, error: null };
                        },
                         maybeSingle: async () => {
                             return { data: null, error: null };
                        }
                     }
                },
                order: () => {
                     return { data: [], error: null };
                },
                 data: [],
                 error: null,
            }
        },
        insert: (data: any) => {
          console.log("Mock insert", data);
           return {
                select: () => {
                     return { data: [data], error: null };
                },
                 error: null
            }
        },
        update: (data: any) => {
             console.log("Mock update", data);
             return {
                 eq: (column: string, value: any) => {
                      return { data: [data], error: null };
                 }
             }
        },
        upsert: (data: any) => {
             console.log("Mock upsert", data);
              return {
                 select: () => {
                      return { data: [data], error: null };
                 },
                  error: null
             }
        }
      };
    },
  };
};
