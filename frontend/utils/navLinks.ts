import { FaHome } from "react-icons/fa";
import { AiOutlineStock } from "react-icons/ai";
import { MdAccountBalanceWallet } from "react-icons/md";
import { FaHistory } from "react-icons/fa";
import { FaStar } from "react-icons/fa";

export interface NavBarLinkType {
  name: string;
  href: string;
  icon: React.ElementType;
}

export const NavBarLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "Portfolio", href: "/portfolio", icon: MdAccountBalanceWallet },
  { name: "Watchlist", href: "/watchlist", icon: FaStar },
  { name: "Transactions", href: "/transactions", icon: FaHistory },
];
export const QuickLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "Portfolio", href: "/portfolio", icon: MdAccountBalanceWallet },
  { name: "Watchlist", href: "/watchlist", icon: FaStar },
  { name: "Transactions", href: "/transactions", icon: FaHistory },
];
