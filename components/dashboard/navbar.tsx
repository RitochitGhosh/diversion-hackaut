'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { Bell, LogOut, ChevronDown, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  serviceName?: string;
  serviceCode?: string;
  role?: string;
}

export function Navbar({ serviceName, serviceCode, role }: NavbarProps) {
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b-3 border-neo-black sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Logo + service */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-neo-yellow border-3 border-neo-black flex items-center justify-center font-display font-black text-sm">
              R
            </div>
            <span className="font-display font-black text-lg hidden md:block">ReviewIQ</span>
          </Link>

          {serviceName && (
            <>
              <span className="text-neo-black/30 font-bold">/</span>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm">{serviceName}</span>
                {serviceCode && (
                  <span className="font-mono text-xs bg-neo-black text-white px-2 py-0.5 border border-neo-black">
                    {serviceCode}
                  </span>
                )}
                {role && (
                  <span className={`font-display font-bold text-xs px-2 py-0.5 border-2 border-neo-black ${
                    role === 'ADMIN' ? 'bg-neo-yellow' : 'bg-neo-blue'
                  }`}>
                    {role}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 border-3 border-neo-black shadow-brutal-sm flex items-center justify-center hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <Bell size={16} />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-neo-orange border border-neo-black rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 border-3 border-neo-black shadow-brutal-sm px-3 py-1.5 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white"
            >
              {user?.picture ? (
                <Image src={user.picture} alt={user.name ?? 'User'} width={24} height={24} className="border-2 border-neo-black" />
              ) : (
                <div className="w-6 h-6 bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                  <User size={12} />
                </div>
              )}
              <span className="font-display font-bold text-sm hidden md:block max-w-[120px] truncate">
                {user?.name ?? user?.email}
              </span>
              <ChevronDown size={12} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 border-3 border-neo-black shadow-brutal bg-white z-50">
                <div className="p-3 border-b-3 border-neo-black bg-neo-cream">
                  <p className="font-display font-bold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-neo-black/50 font-body truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-neo-yellow font-display font-bold text-sm transition-colors"
                  >
                    My Services
                  </Link>
                  <a
                    href="/api/auth/logout"
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-neo-orange font-display font-bold text-sm transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
