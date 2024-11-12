import {
  LayoutDashboard,
  Shapes,
  ShoppingBag,
  Tag,
  UsersRound,
  UtensilsCrossed
} from "lucide-react";

export const navLinks = [
  {
    url: "/dashboard",
    icon: <LayoutDashboard />,
    label: "Dashboard",
  },
  {
    url: "/dashboard/restaurant",
    icon: <UtensilsCrossed />,
    label: "Restaurant",
  },
  {
    url: "/menu",
    icon: <Shapes />,
    label: "MenuItems",
  },
  {
    url: "/payment",
    icon: <Tag />,
    label: "Payments",
  },
  {
    url: "/orders",
    icon: <ShoppingBag />,
    label: "Orders",
  },
  {
    url: "/customers",
    icon: <UsersRound />,
    label: "Customers",
  },
];
