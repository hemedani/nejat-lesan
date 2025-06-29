"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconLogo, } from "../atoms/Icons";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, userLevel, logout } = useAuth();

  // Add scroll detection for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Custom navigation links with icons
  const navLinks = [
    {
      href: "/",
      label: "خانه",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/charts/overall",
      label: "نمودار",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 20l-5.447-17.916m0 0A1 1 0 013.465 1H4.5a1 1 0 011 .97V2m13.5 8A8.5 8.5 0 015.5 10M16 19l5-5m0 0l-5-5m5 5H9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/chatbot",
      label: "چت‌بات",
      icon: (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 10.5h8m-8 3.5h5.5m-9-10h14a2 2 0 012 2v10a2 2 0 01-2 2h-4l-4 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  // Additional dropdown links
  const dropdownLinks = [
    { href: "/faq", label: "سوالات متداول" },
    { href: "/about", label: "درباره ما" },
    { href: "/contact", label: "تماس با ما" },
    { href: "/terms", label: "شرایط" },
    { href: "/privacy", label: "حریم خصوصی" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
      ${isScrolled
          ? "bg-white bg-opacity-90 backdrop-blur-sm shadow-lg py-2"
          : "bg-gradient-to-b from-white to-transparent py-4"
        }
      border-b border-gray-100`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 relative">
        {/* Logo with subtle animation */}
        <div className="text-xl font-bold transform transition-all duration-500 hover:scale-105">
          <Link href="/" className="flex items-center gap-2">
            <IconLogo />
          </Link>
        </div>

        {/* Desktop Navigation - elegant hover effects and RTL support */}
        <nav
          className="hidden md:flex items-center space-x-8 space-x-reverse"
          dir="rtl"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-all duration-300"
            >
              <span className="transform transition-all duration-300 group-hover:scale-110 text-indigo-500">
                {link.icon}
              </span>
              <span className="relative py-2">
                {link.label}
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-indigo-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </span>
            </Link>
          ))}

          {/* Elegant dropdown for additional links */}
          <div className="relative group">
            <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-all duration-300">
              <span className="transform transition-all duration-300 group-hover:scale-110 text-indigo-500">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 6v12m-8-6h16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="relative py-2">
                بیشتر
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-indigo-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </span>
            </button>
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl overflow-hidden shadow-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-10 border border-gray-100">
              {dropdownLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-5 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Links with elegant styling */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated &&
              (userLevel === "Ghost" ||
                userLevel === "Manager" ||
                userLevel === "Editor") && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-lg transition-all duration-300 hover:bg-indigo-50"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>پنل ادمین</span>
                </Link>
              )}

            {isAuthenticated && userLevel === "Normal" && (
              <Link
                href="/user"
                className="flex items-center gap-1.5 px-4 py-2 text-gray-700 hover:text-indigo-600 rounded-lg transition-all duration-300 hover:bg-indigo-50"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>پنل کاربری</span>
              </Link>
            )}

            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-4 py-2 text-gray-700 hover:text-rose-600 rounded-lg transition-all duration-300 hover:bg-rose-50"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>خروج</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-300"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>ورود</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button with animation */}
          <button
            className="md:hidden text-gray-800 hover:text-indigo-600 focus:outline-none transition-transform duration-300 hover:scale-110"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "بستن منو" : "باز کردن منو"}
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute left-0 top-0.5 block w-6 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
              ></span>
              <span
                className={`absolute left-0 top-2.5 block w-6 h-0.5 bg-current transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
              ></span>
              <span
                className={`absolute left-0 top-4.5 block w-6 h-0.5 bg-current transform transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu with smooth animation */}
      <div
        className={`md:hidden absolute left-0 w-full bg-white shadow-xl transition-all duration-500 ease-in-out transform ${isMobileMenuOpen
          ? "opacity-100 translate-y-0 max-h-[80vh] overflow-y-auto"
          : "opacity-0 -translate-y-10 max-h-0 overflow-hidden"
          }`}
      >
        <nav className="flex flex-col items-center py-6 space-y-1" dir="rtl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 w-full py-3 px-6 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="text-indigo-500">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Separator */}
          <div className="w-24 h-px bg-gray-200 my-2"></div>

          {/* Additional Links */}
          {dropdownLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 w-full py-3 px-6 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Admin/User Panel Links */}
          {isAuthenticated &&
            (userLevel === "Ghost" ||
              userLevel === "Manager" ||
              userLevel === "Editor") && (
              <Link
                href="/admin"
                className="flex items-center gap-2 w-full py-3 px-6 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg
                  className="w-4 h-4 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>پنل ادمین</span>
              </Link>
            )}

          {isAuthenticated && userLevel === "Normal" && (
            <Link
              href="/user"
              className="flex items-center gap-2 w-full py-3 px-6 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                className="w-4 h-4 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>پنل کاربری</span>
            </Link>
          )}

          {/* Auth Button */}
          {isAuthenticated ? (
            <button
              className="flex items-center gap-2 w-full py-3 px-6 text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200"
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
            >
              <svg
                className="w-4 h-4 text-rose-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>خروج</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 w-full py-3 px-6 text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                className="w-4 h-4 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>ورود</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
