"use client";
import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import { anurati } from "@/utils/fonts";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Logo() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const logoSrc =
    theme === "dark"
      ? "/logos/stocks-learners-logo-with-title-no-padding-no-bg.png"
      : "/logos/stocks-learners-logo-with-title-no-padding-no-bg.png";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const img = new window.Image();
    img.src = logoSrc;
    img.onload = () => {
      const maxWidth = 150; // set your max width
      const aspectRatio = img.width / img.height;
      let width = maxWidth;
      let height = Math.round(maxWidth / aspectRatio);
      setImgSize({ width, height });
    };
  }, [logoSrc, mounted]);

  // Show text logo during SSR and before theme is determined
  if (!mounted || !imgSize) {
    return (
      <Link
        href={"/"}
        className={cn("text-foreground text-xl font-bold", anurati.className)}
      >
        {appName}
      </Link>
    );
  }

  return (
    <Link href={"/"} className="flex items-center">
      <Image
        src={logoSrc}
        alt={appName}
        width={imgSize.width}
        height={imgSize.height}
        className="h-full w-auto"
        priority
      />
    </Link>
  );
}
