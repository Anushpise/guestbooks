import React from 'react';
import { LayoutDashboard, UserPlus, Zap, Receipt } from 'lucide-react';

export default function BottomNavBar({
  activeTab,
  onTabChange,
  isDesktopSidebarOpen = true,
  isMobileSidebarOpen = false,
  overdueCount = 0
}) {
  const navItems = [
    {
      id: 'dashboard',
      shortLabel: 'Dashboard',
      fullLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: overdueCount > 0 ? overdueCount : null,
      badgeColor: 'bg-rose-600',
    },
    {
      id: 'new-checkin',
      shortLabel: 'New Reg',
      fullLabel: 'New Register',
      icon: UserPlus,
    },
    {
      id: 'express-checkin',
      shortLabel: 'Express',
      fullLabel: 'Express In',
      icon: Zap,
    },
    {
      id: 'billing',
      shortLabel: 'Billing',
      fullLabel: 'Billing & Slip',
      icon: Receipt,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom App Navigation"
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] transition-all duration-300 ${
        isDesktopSidebarOpen ? 'lg:hidden' : 'block'
      } ${isMobileSidebarOpen ? 'hidden' : 'block'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto h-16 items-center px-1 sm:px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer active:scale-95 select-none ${
                isActive
                  ? 'text-[#0b3c33]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute -top-1 w-8 sm:w-10 h-1 rounded-full bg-[#0b3c33] animate-in fade-in zoom-in-75 duration-200" />
              )}

              {/* Icon Container with optional notification badge */}
              <div className="relative">
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 text-[#0b3c33]' : 'text-slate-500'
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {item.badge && (
                  <span className={`absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${item.badgeColor} shadow-xs animate-pulse`}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Responsive Label */}
              <span className={`text-[10px] sm:text-[11px] tracking-tight leading-tight mt-0.5 truncate max-w-full font-heading ${
                isActive ? 'text-[#0b3c33] font-black' : 'text-slate-500 font-semibold'
              }`}>
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.fullLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
