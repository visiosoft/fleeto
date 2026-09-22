import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Close as CloseIcon } from '@mui/icons-material';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`w-64 h-[100dvh] bg-white border-r border-border flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 md:transform-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <button
            onClick={() => handleNavigate('/dashboard')}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-gray-50 transition-colors"
            aria-label="FleetOZ dashboard home"
          >
            <img src="/images/van-logo.svg" alt="" className="w-8 h-8" />
            <span className="font-display text-lg font-bold tracking-tight text-gray-900">
              FleetOZ
            </span>
          </button>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close navigation"
          >
            <CloseIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main navigation">
        <ul className="space-y-0.5 px-3">
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                    active
                      ? 'bg-accent-50 text-accent-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-[3px] rounded-full flex-shrink-0 transition-colors ${
                      active ? 'bg-accent-600' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`flex-shrink-0 w-5 h-5 ${
                      active ? 'text-accent-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-md flex items-center justify-center tabular-figures">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} FleetOZ
          </p>
        </div>
      </div>
    </>
  );
};
