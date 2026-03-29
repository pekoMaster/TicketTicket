'use client';

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-[9999] transition-opacity duration-300">
      <div className="relative flex flex-col items-center gap-4">
        {/* Animated Orbs for Aurora Feel */}
        <div className="absolute -inset-10 bg-pink-500/20 dark:bg-pink-600/30 blur-2xl rounded-full animate-pulse" />
        <div className="absolute -inset-10 bg-indigo-500/20 dark:bg-indigo-600/30 blur-2xl rounded-full animate-pulse delay-700" />
        
        <div className="relative">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin" strokeWidth={2.5} />
          <div className="absolute inset-0 bg-pink-500 blur-md opacity-20 animate-pulse" />
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent animate-pulse">
            TicketTicket
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
