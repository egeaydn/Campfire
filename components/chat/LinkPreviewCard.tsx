"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { fetchLinkPreview, type LinkPreview } from "@/app/actions/link-preview";
import { cn } from "@/lib/utils";

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export function LinkPreviewCard({ url, className }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPreview();
  }, [url]);

  const loadPreview = async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await fetchLinkPreview(url);
      if (data) {
        setPreview(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 border rounded-lg bg-muted/50", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading preview...</span>
      </div>
    );
  }

  if (error || !preview) {
    // Fallback to simple link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 text-sm text-primary hover:underline",
          className
        )}
      >
        <ExternalLink className="w-3 h-3" />
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block border rounded-lg overflow-hidden hover:bg-accent/50 transition-colors max-w-md",
        className
      )}
    >
      {preview.image && (
        <div className="w-full h-48 bg-muted">
          <img
            src={preview.image}
            alt={preview.title || "Link preview"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}
      
      <div className="p-3 space-y-1">
        {preview.title && (
          <h4 className="font-medium text-sm line-clamp-2">{preview.title}</h4>
        )}
        
        {preview.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {preview.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 pt-1">
          {preview.favicon && (
            <img
              src={preview.favicon}
              alt=""
              className="w-4 h-4"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            )}
          <span className="text-xs text-muted-foreground truncate">
            {preview.siteName || new URL(url).hostname}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
        </div>
      </div>
    </a>
  );
}
