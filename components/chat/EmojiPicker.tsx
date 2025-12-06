"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Sık kullanılan emojiler
const COMMON_EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "😡",
  "🎉", "🔥", "⭐", "✅", "❌", "👀",
  "🙏", "💯", "👏", "🤔", "😍", "😊",
  "🤗", "😎", "🥳", "🤩", "😇", "🤓",
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  variant?: "button" | "icon";
  size?: "default" | "sm" | "icon";
}

export function EmojiPicker({
  onEmojiSelect,
  variant = "icon",
  size = "icon",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "button" ? (
          <Button variant="outline" size={size}>
            <Smile className="h-4 w-4 mr-2" />
            Reaksiyon Ekle
          </Button>
        ) : (
          <Button variant="ghost" size={size}>
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="end">
        <div className="grid grid-cols-6 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl p-2 rounded hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
