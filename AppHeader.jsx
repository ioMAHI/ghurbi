const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPen, LogOut, Sun, Moon } from 'lucide-react';
import EditProfileDialog from '@/components/profile/EditProfileDialog';
import useOnlineStatus from '@/lib/useOnlineStatus';

export default function AppHeader() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const online = useOnlineStatus();

  const nickname = user?.nickname || user?.full_name || 'Traveler';
  const avatarUrl = user?.avatar_url || '';
  const initials = (user?.full_name || 'U').slice(0, 2).toUpperCase();

  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogout = () => {
    db.auth.logout('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={dark
                ? "https://media.db.com/images/public/6a1a9f6b2e44e54ff7b008bb/4d43f1903_20260530_141947.png"
                : "https://media.db.com/images/public/6a1a9f6b2e44e54ff7b008bb/2081e9fa7_20260530_142010.png"
              }
              alt="ghurbi?"
              className="h-7 object-contain"
            />
            {!online && (
              <span className="text-[10px] px-1.5 py-0.5 bg-destructive text-destructive-foreground rounded font-medium">
                Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Toggle night mode"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                <Avatar className="w-8 h-8 border border-border">
                  <AvatarImage src={avatarUrl} alt={nickname} />
                  <AvatarFallback className="text-xs font-medium bg-secondary">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
                <UserPen className="w-4 h-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}