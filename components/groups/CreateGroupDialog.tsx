'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Loader2, X, Plus } from 'lucide-react';
import { createGroup } from '@/app/actions/conversations';
import { searchUsers } from '@/app/actions/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function CreateGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search users
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(query);
      // Filter out already selected members
      const filtered = results.filter(
        r => !selectedMembers.find(m => m.id === r.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // Effect for debounced search
  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch]);

  const addMember = (user: User) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearchResults(searchResults.filter(r => r.id !== user.id));
    setSearchQuery('');
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
  };

  const handleCreate = async () => {
    if (!title.trim() || selectedMembers.length === 0) return;

    setLoading(true);
    try {
      console.log('Creating group with members:', selectedMembers.map(m => ({
        id: m.id,
        username: m.username
      })));

      const groupId = await createGroup({
        title: title.trim(),
        memberIds: selectedMembers.map(m => m.id),
      });

      console.log('Group created:', groupId);

      // Reset and close
      setTitle('');
      setSelectedMembers([]);
      setSearchQuery('');
      setOpen(false);

      // Navigate to new group
      router.push(`/chat/${groupId}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Users className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a new group conversation with multiple members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="title">Group Name</Label>
            <Input
              id="title"
              placeholder="Enter group name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Members ({selectedMembers.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback>
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.username}</span>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="hover:text-destructive"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Users */}
          <div className="space-y-2">
            <Label htmlFor="search">Add Members</Label>
            <Input
              id="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />

            {/* Search Results */}
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => addMember(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                    disabled={loading}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || ''} />
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      {user.display_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.display_name}
                        </p>
                      )}
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || selectedMembers.length === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
