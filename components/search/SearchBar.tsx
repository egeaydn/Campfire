'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { searchUsers } from '@/app/actions/users';
import { UserCard } from './UserCard';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const users = await searchUsers(searchQuery);
      setResults(users || []);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
          className="pl-10"
        />
      </div>

      {/* Search Results Dropdown */}
      {(results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {results.map((user) => (
                <UserCard 
                  key={user.id} 
                  user={user}
                  onClose={() => {
                    setQuery('');
                    setResults([]);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
