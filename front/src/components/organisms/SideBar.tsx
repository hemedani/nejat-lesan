"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HomeIcon,
  LogoutIcon,
  SearchIcon,
} from "@/components/atoms/Icons";
import {
  adminNavGroups,
  iconRegistry,
  type AdminNavGroup,
  type AdminNavItem,
} from "@/components/organisms/adminSidebarConfig";

const SIDEBAR_GROUP_STORAGE_KEY = "admin-sidebar-open-groups";

type SideBarItemProps = {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  isTransitioning: boolean;
};

const SideBarItem: FC<SideBarItemProps> = ({ item, isActive, collapsed, isTransitioning }) => {
  const Icon = iconRegistry[item.icon];
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          isActive
            ? "bg-white/10 text-white shadow-lg"
            : "hover:bg-white/5 text-gray-200"
        }`}
      >
        <span className="text-indigo-300">
          <Icon className="w-5 h-5" />
        </span>
        {!collapsed && (
          <span
            className={`font-medium whitespace-nowrap transition-opacity duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            {item.label}
          </span>
        )}
      </Link>
    </li>
  );
};

type SideBarGroupProps = {
  group: AdminNavGroup;
  items: AdminNavItem[];
  isOpen: boolean;
  onToggle: (button: HTMLButtonElement) => void;
  activeHref: string;
  collapsed: boolean;
  isTransitioning: boolean;
};

const SideBarGroup: FC<SideBarGroupProps> = ({
  group,
  items,
  isOpen,
  onToggle,
  activeHref,
  collapsed,
  isTransitioning,
}) => {
  const GroupIcon = iconRegistry[group.icon];
  if (items.length === 0) return null;

  return (
    <li>
      <button
        onClick={(e) => onToggle(e.currentTarget)}
        title={collapsed ? group.title : undefined}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
          isOpen
            ? "bg-white/10 text-white"
            : "hover:bg-white/5 text-gray-200"
        }`}
      >
        <span className="text-indigo-300">
          <GroupIcon className="w-5 h-5" />
        </span>
        {!collapsed && (
          <>
            <span
              className={`flex-1 text-right font-medium transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {group.title}
            </span>
            <ChevronLeftIcon
              className={`w-4 h-4 text-indigo-300 transition-transform duration-300 ${
                isOpen ? "-rotate-90" : "rotate-90"
              }`}
            />
          </>
        )}
      </button>
      {isOpen && !collapsed && (
        <ul className="mt-1 mr-4 space-y-1 border-r border-indigo-700/40 pr-1">
          {items.map((item) => (
            <SideBarItem
              key={item.href}
              item={item}
              isActive={activeHref === item.href}
              collapsed={collapsed}
              isTransitioning={isTransitioning}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const AdminSidebar: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const asideRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [search, setSearch] = useState("");
  const [flyoutGroup, setFlyoutGroup] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const allIds = adminNavGroups.map((group) => group.id);
    if (typeof window === "undefined") return new Set(allIds);
    const stored = localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        return new Set(allIds.filter((id) => parsed.includes(id)));
      } catch {
        return new Set(allIds);
      }
    }
    return new Set(allIds);
  });

  useEffect(() => {
    const activeGroup = adminNavGroups.find((group) =>
      group.items.some((item) => item.href === pathname)
    );
    if (activeGroup) {
      setOpenGroups((prev) =>
        prev.has(activeGroup.id) ? prev : new Set(prev).add(activeGroup.id)
      );
    }
    setFlyoutGroup(null);
  }, [pathname]);

  useEffect(() => {
    if (!collapsed) setFlyoutGroup(null);
  }, [collapsed]);

  useEffect(() => {
    if (!flyoutGroup) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (asideRef.current && !asideRef.current.contains(event.target as Node)) {
        setFlyoutGroup(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [flyoutGroup]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify([...openGroups]));
  }, [openGroups]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleCollapse = () => {
    setIsTransitioning(true);
    setCollapsed((prev) => !prev);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [collapsed]);

  const logOutHandler = async () => {
    logout();
  };

  const normalizedSearch = search.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;
  const matchesSearch = (label: string) => label.toLowerCase().includes(normalizedSearch);

  return (
    <aside
      ref={asideRef}
      className={`relative sticky top-16 h-full bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white flex flex-col shadow-xl z-10 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {!collapsed && (
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300 opacity-100 transition-opacity duration-300">
            پنل ادمین
          </div>
        )}
        <button
          onClick={handleToggleCollapse}
          className="p-2 rounded-full hover:bg-indigo-800/50 transition-all duration-300"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی منو..."
              className="w-full bg-white/10 border border-indigo-700/50 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-indigo-300/70 focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="پاک کردن جستجو"
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-indigo-300 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto sidebar-scrollbar">
        <ul className="space-y-1 p-3">
          {adminNavGroups.map((group) => {
            const items = isSearching
              ? group.items.filter((item) => matchesSearch(item.label))
              : group.items;
            const isOpen = isSearching ? items.length > 0 : openGroups.has(group.id);
            const isFlyoutOpen = flyoutGroup === group.id;

            return (
              <SideBarGroup
                key={group.id}
                group={group}
                items={items}
                isOpen={isOpen}
                onToggle={(button) => {
                  if (collapsed) {
                    if (isFlyoutOpen) {
                      setFlyoutGroup(null);
                    } else {
                      const asideTop = asideRef.current?.getBoundingClientRect().top ?? 0;
                      setFlyoutTop(button.getBoundingClientRect().top - asideTop);
                      setFlyoutGroup(group.id);
                    }
                  } else {
                    toggleGroup(group.id);
                  }
                }}
                activeHref={pathname}
                collapsed={collapsed}
                isTransitioning={isTransitioning}
              />
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <button
          onClick={() => router.replace("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-300"
        >
          <span className="text-indigo-300">
            <HomeIcon className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span
              className={`font-medium transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              خانه
            </span>
          )}
        </button>

        <button
          onClick={logOutHandler}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-300"
        >
          <span className="text-pink-300">
            <LogoutIcon className="w-5 h-5" />
          </span>
          {!collapsed && (
            <span
              className={`font-medium transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              خروج از حساب
            </span>
          )}
        </button>
      </div>

      {!collapsed && (
          <div className="p-4 text-center text-xs text-slate-500">
          <span>© ۱۴۰۳ پنل مدیریت</span>
        </div>
      )}

      {collapsed && flyoutGroup && (() => {
        const group = adminNavGroups.find((g) => g.id === flyoutGroup);
        if (!group) return null;
        const GroupIcon = iconRegistry[group.icon];
        return (
          <div
            style={{ top: flyoutTop }}
            className="absolute right-full mr-2 w-56 bg-gradient-to-b from-indigo-900 to-purple-900 border border-indigo-700/50 rounded-xl shadow-2xl z-20 overflow-hidden"
          >
            <div className="px-3 py-2.5 flex items-center gap-2 border-b border-indigo-700/50">
              <span className="text-indigo-300">
                <GroupIcon className="w-5 h-5" />
              </span>
              <span className="font-bold text-sm">{group.title}</span>
            </div>
            <ul className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto sidebar-scrollbar">
              {group.items.map((item) => (
                <SideBarItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={false}
                  isTransitioning={false}
                />
              ))}
            </ul>
          </div>
        );
      })()}
    </aside>
  );
};
