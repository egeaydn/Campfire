"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, UserPlus, Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

export function NewConversationModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const router = useRouter();

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  // Toggle user selection for group
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Create DM conversation
  const createDirectMessage = async (otherUserId: string) => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if DM conversation already exists between these two users
      // Get all conversations where current user is a member
      const { data: myConversations, error: myConvError } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myConvError) throw myConvError;

      if (myConversations && myConversations.length > 0) {
        const conversationIds = myConversations.map((c) => c.conversation_id);

        // Find conversations where the other user is also a member and it's a DM (not group)
        const { data: existingDM, error: dmError } = await supabase
          .from("conversation_members")
          .select(`
            conversation_id,
            conversations!inner(id, is_group, type)
          `)
          .eq("user_id", otherUserId)
          .in("conversation_id", conversationIds);

        if (!dmError && existingDM && existingDM.length > 0) {
          // Find the DM conversation (not group)
          const dmConversation = existingDM.find((c: any) => 
            c.conversations && !c.conversations.is_group && c.conversations.type === "dm"
          );

          if (dmConversation) {
            // Navigate to existing DM
            router.push(`/chat/${dmConversation.conversation_id}`);
            setOpen(false);
            return;
          }
        }
      }

      // Create new DM conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "dm",
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both members
      const { error: membersError } = await supabase
        .from("conversation_members")
        .insert([
          { conversation_id: conversation.id, user_id: user.id, role: "admin" },
          { conversation_id: conversation.id, user_id: otherUserId, role: "member" },
        ]);

      if (membersError) throw membersError;

      // Navigate to new conversation
      router.push(`/chat/${conversation.id}`);
      setOpen(false);
      resetState();
    } catch (error) {
      console.error("Error creating DM:", error);
      alert("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  // Create group conversation
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert("Please enter a group name and select at least one member");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          type: "group",
          title: groupName,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator and selected members
      const members = [
        { conversation_id: conversation.id, user_id: user.id, role: "admin" },
        ...selectedUsers.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: "member",
        })),
      ];

      const { error: membersError } = await supabase
        .from("conversation_members")
        .insert(members);

      if (membersError) throw membersError;

      // Navigate to new group
      router.push(`/chat/${conversation.id}`);
      setOpen(false);
      resetState();
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName("");
    setActiveTab("dm");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a direct message or create a group
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dm" | "group")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dm">
              <UserPlus className="w-4 h-4 mr-2" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="w-4 h-4 mr-2" />
              Group
            </TabsTrigger>
          </TabsList>

          {/* Direct Message Tab */}
          <TabsContent value="dm" className="space-y-4">
            <div className="space-y-2">
              <Label>Search users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searching && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-sm text-muted-foreground p-4">
                  No users found
                </p>
              )}

              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => createDirectMessage(user.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} />
                    ) : (
                      <div className="bg-gradient-to-br from-orange-500 to-pink-500 w-full h-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Group Tab */}
          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label>Group name</Label>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Search and add members</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected members ({selectedUsers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const user = searchResults.find((u) => u.id === userId);
                    if (!user) return null;
                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-2 bg-accent px-3 py-1 rounded-full"
                      >
                        <span className="text-sm">{user.username}</span>
                        <button
                          onClick={() => toggleUserSelection(userId)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {searching && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {searchResults.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <Checkbox checked={isSelected} />
                    <Avatar className="h-10 w-10">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} />
                      ) : (
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 w-full h-full flex items-center justify-center text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={createGroup}
              disabled={loading || !groupName.trim() || selectedUsers.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Create Group
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
