import { FaHome } from "react-icons/fa";
import { RiDashboardLine } from "react-icons/ri";
import { AiOutlineStock } from "react-icons/ai";

export interface NavBarLinkType {
  name: string;
  href: string;
  icon: React.ElementType;
}

export const NavBarLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "Dashboard", href: "/dashboard", icon: RiDashboardLine },
];
export const QuickLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "Dashboard", href: "/dashboard", icon: RiDashboardLine },
];
