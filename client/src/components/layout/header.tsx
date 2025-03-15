import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";
import { UserRole } from "@shared/schema";
import { RoleBadge } from "../forum/role-badge";
import { UserAvatar } from "../forum/user-avatar";
import { LoginModal } from "../modals/login-modal";
import { RegisterModal } from "../modals/register-modal";
import { EditProfileModal } from "../modals/edit-profile-modal";
import { AdminPanelModal } from "../modals/admin-panel-modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Shield, 
  ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAdminPanelModal, setShowAdminPanelModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  return (
    <header className="bg-secondary-bg border-b border-divider shadow-md w-full overflow-hidden">
      <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 flex flex-wrap items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold font-sans cursor-pointer">
              <span className="text-bright-blue-gray">DEFEND</span>
              <span className="text-red-600">FF</span>
            </h1>
          </Link>
        </div>
        
        {/* Search */}
        <div className="order-3 md:order-2 w-full md:w-auto mt-4 md:mt-0 md:mx-4 flex-grow md:max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Поиск..."
              className="w-full py-2 px-2 sm:px-4 bg-dark-bg rounded-lg text-white focus:ring-2 focus:ring-bright-blue-gray"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              variant="ghost" 
              className="absolute right-0 top-0 h-full px-2 sm:px-4 text-blue-gray"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
        
        {/* User Menu (Logged In) or Login/Register buttons */}
        {user ? (
          <div className="order-2 md:order-3 flex items-center">
            <ThemeToggle />
            <div className="ml-1 sm:ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 px-1 sm:px-3">
                    <UserAvatar 
                      user={{
                        username: user.username,
                        avatar: user.avatar || undefined
                      }} 
                      className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-bright-blue-gray" 
                    />
                    <span className="hidden md:inline-block text-xs sm:text-sm">{user.username}</span>
                    <RoleBadge role={user.role} showText />
                    <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-secondary-bg border-divider">
                  <DropdownMenuItem onClick={() => setShowEditProfileModal(true)} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </DropdownMenuItem>
                  {user.role === UserRole.ADMIN && (
                    <DropdownMenuItem 
                      onClick={() => setShowAdminPanelModal(true)} 
                      className="cursor-pointer text-admin-red"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Панель администратора</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-divider" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-3 flex items-center space-x-1 sm:space-x-2">
            <ThemeToggle />
            <div className="ml-1 sm:ml-2 flex space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-gray hover:bg-bright-blue-gray border-none text-xs sm:text-sm"
                onClick={() => setShowLoginModal(true)}
              >
                Вход
              </Button>
              <Button
                size="sm"
                className="bg-bright-blue-gray hover:bg-opacity-80 text-xs sm:text-sm"
                onClick={() => setShowRegisterModal(true)}
              >
                Регистрация
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onShowRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onShowLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
      
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
      
      <AdminPanelModal
        isOpen={showAdminPanelModal}
        onClose={() => setShowAdminPanelModal(false)}
      />
    </header>
  );
}