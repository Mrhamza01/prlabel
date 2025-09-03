'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Button } from './button';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { isAuthenticated, username, logout } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    username: state.username,
    logout: state.logout,
  }));

 

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-4 shadow-sm">
        <div className="flex flex-1">
          <span className="text-lg font-semibold">PR Label System</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {username || 'User'}
          </span>
          
        </div>
      </div>
    </nav>
  );
}
