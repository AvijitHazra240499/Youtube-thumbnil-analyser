import React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Image,
  FileText,
  Search,
  Users,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProStatus } from "@/hooks/useProStatus";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import TrialCountdown from "@/components/TrialCountdown";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Image, label: "Thumbnail Analyzer", path: "/thumbnail-analyzer" },
    { icon: FileText, label: "AI Script Factory", path: "/script-generator" },
    { icon: Search, label: "Keyword Research", path: "/keyword-matrix" },
    { icon: Sparkles, label: "Image Generator", path: "/image-generator" },
    { icon: Twitter, label: "Tweet Generator", path: "/tweet-generator" },
  ];

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.label : "Dashboard";
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-gray-900">
        <div className="p-4 border-b border-gray-800">
          {/* <h1 className="text-xl font-bold text-[#00F0FF]">
            CreatorVision Pro
          </h1> */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#00F0FF]" />
            <h1 className="text-xl font-bold">CreatorVision Pro</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                  ${isActive ? 'bg-[#00F0FF]/10 text-[#00F0FF] font-semibold' : 'hover:bg-gray-800'}
                `}
                style={isActive ? { fontWeight: 700 } : {}}
              >
                <item.icon size={20} className={isActive ? "text-[#00F0FF]" : "text-[#00F0FF] opacity-80"} />
                <span>{item.label}</span>
                {item.label === "AI Script Factory" && (
                  <span className="ml-2 text-red-500 text-xs">●</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings size={20} />
            <span>Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-400"
            onClick={logout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-gray-900 border-r border-gray-800"
        >
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-[#00F0FF]">
              CreatorVision Pro
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} className="text-[#00F0FF]" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Settings size={20} />
              <span>Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-400"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TrialCountdown />
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </Button>
            <h2 className="text-lg font-medium">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="relative px-6 py-2 font-medium transition-all duration-200 border-none bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] text-black hover:from-[#00A3FF] hover:to-[#00F0FF] hover:shadow-lg hover:shadow-[#00F0FF]/20 rounded-lg"
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Pro
            </Button>

            {/* Avatar with Pro badge */}
            {(() => {
              const user = useCurrentUser();
              const { isPro } = useProStatus(user?.id);
              return (
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=creator" />
                    <AvatarFallback className="bg-gray-700">CN</AvatarFallback>
                  </Avatar>
                  {isPro && (
                    <span className="px-2 py-1 bg-[#00F0FF] text-black rounded text-xs font-bold">Pro</span>
                  )}
                </div>
              );
            })()}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
