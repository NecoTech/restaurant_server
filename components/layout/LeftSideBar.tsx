"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { navLinks } from "..//..//lib/constants";
import { LogOut } from 'lucide-react';

const LeftSideBar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    try {
      // Remove the admin token from localStorage
      localStorage.removeItem('adminToken');

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="h-screen left-0 top-0 sticky p-10 flex flex-col gap-16 bg-blue-2 shadow-xl max-lg:hidden">
      <Image src="/logo1.png" alt="logo" width={150} height={70} />

      <div className="flex flex-col gap-12">
        {navLinks.map((link) => (
          <Link
            href={link.url}
            key={link.label}
            className={`flex gap-4 text-body-medium ${pathname === link.url ? "text-blue-1" : "text-grey-1"
              }`}
          >
            {link.icon} <p>{link.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-body-medium text-grey-1 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default LeftSideBar;