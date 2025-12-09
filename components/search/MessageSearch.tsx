"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchMessages, saveSearchHistory, getRecentSearches } from "@/app/actions/search";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  conversation_id: string;
  sender_username: string;
  content: string;
  created_at: string;
  conversation_title: string;
  conversation_type: string;
}

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageSearch({ open, onOpenChange }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadRecentSearches();
    } else {
      // Dialog kapanınca sonuçları temizle
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const loadRecentSearches = async () => {
    const recent = await getRecentSearches(5);
    setRecentSearches(recent);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await searchMessages(searchQuery, 50);
      setResults(data);
      
      // Arama geçmişine kaydet
      if (data.length > 0) {
        await saveSearchHistory(searchQuery);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/chat/${result.conversation_id}?highlight=${result.id}`);
    onOpenChange(false);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search messages..."
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-6 py-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {result.sender_username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          in {result.conversation_title || "Direct Message"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlightMatch(result.content, query)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(result.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No messages found for "{query}"
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {recentSearches.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recent)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-accent transition-colors text-sm"
                      >
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
