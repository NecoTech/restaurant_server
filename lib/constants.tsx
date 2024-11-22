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
    url: "/dashboard/menu-items",
    icon: <Shapes />,
    label: "MenuItems",
  },
  {
    url: "/dashboard/payments",
    icon: <Tag />,
    label: "Payments",
  },
  {
    url: "/dashboard/orders",
    icon: <ShoppingBag />,
    label: "Orders",
  },
  {
    url: "/customers",
    icon: <UsersRound />,
    label: "Customers",
  },
];
