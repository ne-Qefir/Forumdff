import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { CreateTopicModal } from "../modals/create-topic-modal";
import { UserAvatar } from "../forum/user-avatar";
import { RoleBadge } from "../forum/role-badge";
import { Button } from "@/components/ui/button";
import { 
  Home,
  Flame,
  Newspaper,
  MessageSquare,
  HelpCircle,
  Plus
} from "lucide-react";

type SidebarItemProps = {
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
  onClick?: () => void;
};

function SidebarItem({ icon, text, isActive, onClick }: SidebarItemProps) {
  return (
    <div 
      className={`py-3 px-3 rounded-lg cursor-pointer flex items-center ${
        isActive 
          ? "bg-blue-gray" 
          : "hover:bg-blue-gray/30"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="ml-3">{text}</span>
    </div>
  );
}

type SidebarProps = {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
};

export function Sidebar({ activeCategory, onSelectCategory }: SidebarProps) {
  const { user } = useAuth();
  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  
  // Mock online users for UI purposes
  const onlineUsers = [
    { id: 1, username: "Qefir", role: "admin", avatar: "" },
    { id: 2, username: "ТехМодератор", role: "moderator", avatar: "" },
    { id: 3, username: "Владимир92", role: "user", avatar: "" },
  ];

  return (
    <div className="md:w-64 flex-shrink-0 mb-6 md:mb-0">
      <div className="bg-secondary-bg rounded-lg p-4 shadow-md">
        <div className="mb-4">
          <Button 
            onClick={() => setShowCreateTopicModal(true)}
            className="w-full bg-bright-blue-gray hover:bg-opacity-80 text-white font-medium flex items-center justify-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать тему
          </Button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-sans font-semibold mb-3 text-white">
            Категории
          </h3>
          <div className="space-y-1">
            <SidebarItem 
              icon={<Home className="h-5 w-5" />} 
              text="Главная" 
              isActive={activeCategory === "all"}
              onClick={() => onSelectCategory("all")}
            />
            <SidebarItem 
              icon={<Flame className="h-5 w-5" />} 
              text="Популярные темы"
              isActive={activeCategory === "popular"}
              onClick={() => onSelectCategory("popular")}
            />
            <SidebarItem 
              icon={<Newspaper className="h-5 w-5" />} 
              text="Новости"
              isActive={activeCategory === "Новости"}
              onClick={() => onSelectCategory("Новости")}
            />
            <SidebarItem 
              icon={<MessageSquare className="h-5 w-5" />} 
              text="Обсуждения"
              isActive={activeCategory === "Общие обсуждения"}
              onClick={() => onSelectCategory("Общие обсуждения")}
            />
            <SidebarItem 
              icon={<HelpCircle className="h-5 w-5" />} 
              text="Вопросы"
              isActive={activeCategory === "Вопросы"}
              onClick={() => onSelectCategory("Вопросы")}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-sans font-semibold mb-3 text-white">
            Пользователи онлайн
          </h3>
          <div className="space-y-3">
            {onlineUsers.map((onlineUser) => (
              <div key={onlineUser.id} className="flex items-center">
                <UserAvatar 
                  user={onlineUser as any} 
                  className="h-8 w-8 rounded-full"
                />
                <span className="ml-2">{onlineUser.username}</span>
                <div className="ml-auto">
                  <RoleBadge role={onlineUser.role} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={showCreateTopicModal}
        onClose={() => setShowCreateTopicModal(false)}
      />
    </div>
  );
}
