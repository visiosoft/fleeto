import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  ExpandMore as ExpandMoreIcon,
  PersonOutline as PersonOutlineIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  LogoutOutlined as LogoutOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Close on outside click or Escape so the menu can't be left stranded open.
  useEffect(() => {
    if (!showUserMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const goTo = (path: string) => {
    setShowUserMenu(false);
    navigate(path);
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left - menu toggle + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation"
        >
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>

        <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-gray-900 truncate">
          {title}
        </h1>
      </div>

      {/* Right - account menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowUserMenu((open) => !open)}
          className="flex items-center gap-2.5 p-1.5 pr-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-haspopup="menu"
          aria-expanded={showUserMenu}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-lg bg-accent-600 text-white flex items-center justify-center text-sm font-semibold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </span>
          )}
          <span className="text-left hidden md:block leading-tight">
            <span className="block text-sm font-medium text-gray-900">{user?.name || 'User'}</span>
            {user?.email && <span className="block text-xs text-gray-500">{user.email}</span>}
          </span>
          <ExpandMoreIcon
            className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showUserMenu && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl shadow-lg-tinted py-1.5"
          >
            <button
              role="menuitem"
              onClick={() => goTo('/profile')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <PersonOutlineIcon sx={{ fontSize: 18 }} />
              Profile
            </button>
            <button
              role="menuitem"
              onClick={() => goTo('/settings')}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
              Settings
            </button>
            <hr className="my-1.5 border-border" />
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
