"use client";

import React, { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HomeIcon, UserIcon, UsersIcon,
  CogIcon, HeartIcon, LogoutIcon, ChevronLeftIcon, ChevronRightIcon
} from "@/components/atoms/Icons";
import { snakeToKebabCase, translateModelNameToPersian } from "@/utils/helper";

type MenuItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const defaultMenuItems: MenuItem[] = [
  { label: "داشبورد", href: "/admin", icon: <HomeIcon className="w-5 h-5" /> },
  { label: "کاربران", href: "/admin/users", icon: <UsersIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("accident"), href: `/admin/${snakeToKebabCase("accident")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("air_status"), href: `/admin/${snakeToKebabCase("air_status")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("area_usage"), href: `/admin/${snakeToKebabCase("area_usage")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("body_insurance_co"), href: `/admin/${snakeToKebabCase("body_insurance_co")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("city"), href: `/admin/${snakeToKebabCase("city")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("city_zone"), href: `/admin/${snakeToKebabCase("city_zone")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("collision_type"), href: `/admin/${snakeToKebabCase("collision_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("color"), href: `/admin/${snakeToKebabCase("color")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("equipment_damage"), href: `/admin/${snakeToKebabCase("equipment_damage")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("fault_status"), href: `/admin/${snakeToKebabCase("fault_status")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("human_reason"), href: `/admin/${snakeToKebabCase("human_reason")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("insurance_co"), href: `/admin/${snakeToKebabCase("insurance_co")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("licence_type"), href: `/admin/${snakeToKebabCase("licence_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("light_status"), href: `/admin/${snakeToKebabCase("light_status")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("max_damage_section"), href: `/admin/${snakeToKebabCase("max_damage_section")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("motion_direction"), href: `/admin/${snakeToKebabCase("motion_direction")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("plaque_type"), href: `/admin/${snakeToKebabCase("plaque_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("plaque_usage"), href: `/admin/${snakeToKebabCase("plaque_usage")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("position"), href: `/admin/${snakeToKebabCase("position")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("province"), href: `/admin/${snakeToKebabCase("province")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("road"), href: `/admin/${snakeToKebabCase("road")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("road_defect"), href: `/admin/${snakeToKebabCase("road_defect")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("road_repair_type"), href: `/admin/${snakeToKebabCase("road_repair_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("road_situation"), href: `/admin/${snakeToKebabCase("road_situation")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("road_surface_condition"), href: `/admin/${snakeToKebabCase("road_surface_condition")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("ruling_type"), href: `/admin/${snakeToKebabCase("ruling_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("shoulder_status"), href: `/admin/${snakeToKebabCase("shoulder_status")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("system"), href: `/admin/${snakeToKebabCase("system")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("system_type"), href: `/admin/${snakeToKebabCase("system_type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("traffic_zone"), href: `/admin/${snakeToKebabCase("traffic_zone")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("type"), href: `/admin/${snakeToKebabCase("type")}`, icon: <UserIcon className="w-5 h-5" /> },
  { label: translateModelNameToPersian("vehicle_reason"), href: `/admin/${snakeToKebabCase("vehicle_reason")}`, icon: <UserIcon className="w-5 h-5" /> },
];

type TProps = {
  menuItemsProps?: { label: string; href: string }[];
  title?: string;
};

export const AdminSidebar: FC<TProps> = ({ menuItemsProps, title = "پنل ادمین" }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const logOutHandler = async () => {
    logout();
  };

  // Map custom menu items to include icons
  const mappedMenuItems = menuItemsProps ? menuItemsProps.map(item => {
    if (item.href.includes('/user/favorite/blog')) {
      return { ...item, icon: <HeartIcon className="w-5 h-5" /> };
    } else if (item.href.includes('/user/favorite/article')) {
      return { ...item, icon: <HeartIcon className="w-5 h-5" /> };
    } else if (item.href === '/user') {
      return { ...item, icon: <UserIcon className="w-5 h-5" /> };
    } else if (item.href === '/admin') {
      return { ...item, icon: <CogIcon className="w-5 h-5" /> };
    }
    return { ...item, icon: <CogIcon className="w-5 h-5" /> };
  }) : defaultMenuItems;

  const handleToggleCollapse = () => {
    setIsTransitioning(true);
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [collapsed]);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-5rem)] bg-gradient-to-b from-indigo-900 to-purple-900 text-white flex flex-col shadow-xl z-10 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-indigo-700/50">
        {!collapsed && (
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-blue-300 opacity-100 transition-opacity duration-300">
            {title}
          </div>
        )}
        <button
          onClick={handleToggleCollapse}
          className="p-2 rounded-full hover:bg-indigo-800/50 transition-all duration-300"
        >
          {collapsed ?
            <ChevronRightIcon className="w-5 h-5" /> :
            <ChevronLeftIcon className="w-5 h-5" />
          }
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-transparent">
        <ul className="space-y-1 p-3">
          {mappedMenuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${pathname === item.href
                  ? "bg-white/10 text-white shadow-lg"
                  : "hover:bg-white/5 text-gray-200"
                  }`}
              >
                <span className="text-indigo-300">{item.icon}</span>
                {!collapsed && (
                  <span className={`font-medium transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-indigo-700/50 p-3 space-y-1">
        <button
          onClick={() => router.replace("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-300"
        >
          <span className="text-indigo-300"><HomeIcon className="w-5 h-5" /></span>
          {!collapsed && (
            <span className={`font-medium transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              خانه
            </span>
          )}
        </button>

        <button
          onClick={logOutHandler}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-300"
        >
          <span className="text-pink-300"><LogoutIcon className="w-5 h-5" /></span>
          {!collapsed && (
            <span className={`font-medium transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              خروج از حساب
            </span>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 text-center text-xs text-indigo-300/70">
          <span>© ۱۴۰۳ پنل مدیریت</span>
        </div>
      )}
    </aside>
  );
};
