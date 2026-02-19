import React from "react";

export default function AuthNavbar({ brandText }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-6 bg-transparent">
      <span className="text-sm font-semibold text-white/90 tracking-[-0.01em] drop-shadow-md">{brandText}</span>
    </header>
  );
}
