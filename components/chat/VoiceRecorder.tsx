"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onRecordComplete: (audioBlob: Blob) => void;
  onCancel?: () => void;
}

export function VoiceRecorder({ onRecordComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Microphone access denied or not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setDuration(0);
    onCancel?.();
  };

  const sendRecording = () => {
    if (audioBlob) {
      onRecordComplete(audioBlob);
      setAudioBlob(null);
      setDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 p-4 bg-accent rounded-lg">
        <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1" />
        <Button onClick={cancelRecording} variant="ghost" size="icon">
          <X className="w-4 h-4" />
        </Button>
        <Button onClick={sendRecording} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 flex-1 px-4 py-2 bg-destructive/10 rounded-lg">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
            <span className="text-sm text-muted-foreground">Recording...</span>
          </div>
          <Button onClick={cancelRecording} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
          <Button onClick={stopRecording} variant="destructive" size="icon">
            <Square className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <Button onClick={startRecording} variant="outline" size="icon" title="Record voice message">
          <Mic className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
