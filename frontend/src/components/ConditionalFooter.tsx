"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

const HIDE_FOOTER_PATHS = new Set(["/cart", "/checkout"]);

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER_PATHS.has(pathname)) {
    return null;
  }
  return <Footer />;
}
