import React from "react";
import { cn } from "lib/utils";
import { Menu, MoreVertical, List } from "lucide-react";

import AdminNavbarLinks from "./AdminNavbarLinks";

export default function AdminNavbar({ brandText, miniActive, sidebarMinimize, handleDrawerToggle }) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      {/* Sidebar toggle - desktop only */}
      <div className="hidden md:block mr-2">
        <button
          onClick={sidebarMinimize}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white border border-input shadow-sm hover:bg-accent transition-colors"
        >
          {miniActive ? (
            <List className="h-4 w-4 text-muted-foreground" />
          ) : (
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Brand text */}
      <div className="flex-1">
        <span className="text-lg font-semibold text-foreground">{brandText}</span>
      </div>

      {/* Desktop navbar links */}
      <div className="hidden md:flex items-center">
        <AdminNavbarLinks />
      </div>

      {/* Mobile menu button */}
      <button
        className="inline-flex items-center justify-center h-9 w-9 rounded-md md:hidden hover:bg-accent transition-colors"
        onClick={handleDrawerToggle}
        aria-label="open drawer"
      >
        <Menu className="h-5 w-5" />
      </button>
    </header>
  );
}
