"use client";
import { usePathname } from "next/navigation";
import MainBottomNavBar from "./MainBottomNavBar";

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // Hide bottom navigation on admin pages or specific routes
  const hideBottomNav =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname === "/qr-scanner";

  if (hideBottomNav) {
    return null;
  }

  return <MainBottomNavBar />;
}
