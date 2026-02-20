import React from "react";
import { cn } from "lib/utils";
import { Menu, MoreVertical, List } from "lucide-react";

import AdminNavbarLinks from "./AdminNavbarLinks";

interface AdminNavbarProps {
  brandText: any;
  miniActive: any;
  sidebarMinimize: any;
  handleDrawerToggle: any;
}

export default function AdminNavbar({ brandText, miniActive, sidebarMinimize, handleDrawerToggle }: AdminNavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-5 bg-background/80 backdrop-blur-xl border-b border-border/40">
      {/* Sidebar toggle - desktop only */}
      <div className="hidden md:block mr-3">
        <button
          onClick={sidebarMinimize}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-all duration-150"
        >
          {miniActive ? (
            <List className="h-4 w-4" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Brand text */}
      <div className="flex-1">
        <span className="text-sm font-semibold text-foreground tracking-[-0.01em]">{brandText}</span>
      </div>

      {/* Desktop navbar links */}
      <div className="hidden md:flex items-center">
        <AdminNavbarLinks />
      </div>

      {/* Mobile menu button */}
      <button
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg md:hidden text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-all duration-150"
        onClick={handleDrawerToggle}
        aria-label="open drawer"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>
    </header>
  );
}
