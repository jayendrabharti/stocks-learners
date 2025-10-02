"use client";
import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href={"/"} className="flex w-max flex-row items-center gap-2">
      <Image
        src="/logos/stocks-learners-logo.png"
        alt={`${appName} Logo`}
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className={cn("text-foreground text-xl font-bold")}>
        {appName.toUpperCase()}
      </span>
    </Link>
  );
}
