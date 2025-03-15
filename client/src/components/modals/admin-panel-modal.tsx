import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserRole, topicCategories } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "../forum/user-avatar";
import { RoleBadge } from "../forum/role-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Edit, 
  Ban, 
  Trash, 
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus
} from "lucide-react";

type AdminPanelModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("user-management");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isOpen && activeTab === "user-management",
  });

  // Filter users based on search and role
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role: newRole });

      if (res.ok) {
        // Update user list
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });

        toast({
          title: "Успех",
          description: "Роль пользователя обновлена",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary-bg border-divider text-white max-w-4xl w-[95%] p-3 sm:p-6">
        <DialogHeader className="flex justify-between items-center mb-3 sm:mb-6">
          <DialogTitle className="text-lg sm:text-xl font-sans font-bold">
            Панель администратора
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dark-bg border-b border-divider mb-4 sm:mb-6 flex overflow-x-auto no-scrollbar">
            <TabsTrigger 
              value="user-management" 
              className="data-[state=active]:text-bright-blue-gray data-[state=active]:border-b-2 data-[state=active]:border-bright-blue-gray text-xs sm:text-sm flex-shrink-0"
            >
              Управление пользователями
            </TabsTrigger>
            <TabsTrigger 
              value="forum-management"
              className="data-[state=active]:text-bright-blue-gray data-[state=active]:border-b-2 data-[state=active]:border-bright-blue-gray text-xs sm:text-sm flex-shrink-0"
            >
              Управление форумом
            </TabsTrigger>
            <TabsTrigger 
              value="content-moderation"
              className="data-[state=active]:text-bright-blue-gray data-[state=active]:border-b-2 data-[state=active]:border-bright-blue-gray text-xs sm:text-sm flex-shrink-0"
            >
              Модерация контента
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="user-management">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
              <Input
                type="text"
                placeholder="Поиск пользователей..."
                className="bg-dark-bg border-divider w-full sm:max-w-md"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="bg-dark-bg border-divider w-full sm:w-[180px]">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent className="bg-secondary-bg border-divider">
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Администраторы</SelectItem>
                  <SelectItem value={UserRole.MODERATOR}>Модераторы</SelectItem>
                  <SelectItem value={UserRole.USER}>Пользователи</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-dark-bg">
                    <th className="p-2 sm:p-3 rounded-tl-lg">Пользователь</th>
                    <th className="p-2 sm:p-3 hidden sm:table-cell">Email</th>
                    <th className="p-2 sm:p-3">Роль</th>
                    <th className="p-2 sm:p-3 hidden sm:table-cell">Дата</th>
                    <th className="p-2 sm:p-3 rounded-tr-lg">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user: any) => (
                    <tr key={user.id} className="border-b border-divider">
                      <td className="p-2 sm:p-3 flex items-center">
                        <UserAvatar user={user} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2" />
                        <span className="truncate max-w-[80px] sm:max-w-[120px]">{user.username}</span>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">
                        <span className="truncate max-w-[150px] block">{user.email}</span>
                      </td>
                      <td className="p-2 sm:p-3">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-[100px] sm:w-[180px] bg-transparent border-0 p-0">
                            <SelectValue>
                              <RoleBadge role={user.role} showText={window.innerWidth > 640} />
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-secondary-bg border-divider">
                            <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
                            <SelectItem value={UserRole.MODERATOR}>Модератор</SelectItem>
                            <SelectItem value={UserRole.USER}>Пользователь</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-admin-red h-8 w-8">
                            <Ban className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <Button className="bg-bright-blue-gray hover:bg-opacity-80 w-full sm:w-auto text-xs sm:text-sm">
                <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Добавить пользователя
              </Button>

              <div className="flex items-center w-full sm:w-auto justify-center">
                <Button variant="outline" size="sm" className="bg-dark-bg rounded-l-lg border-r border-divider">
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="px-2 sm:px-4 py-1 bg-dark-bg text-xs sm:text-sm">1 из 1</span>
                <Button variant="outline" size="sm" className="bg-dark-bg rounded-r-lg">
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Forum Management Tab */}
          <TabsContent value="forum-management">
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Категории форума</h4>
              <div className="space-y-2">
                {topicCategories.map((category) => (
                  <div key={category} className="flex items-center justify-between bg-dark-bg p-3 rounded-lg">
                    <span>{category}</span>
                    <div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-admin-red">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-3 bg-blue-gray hover:bg-opacity-80">
                <Plus className="mr-2 h-4 w-4" />
                Добавить категорию
              </Button>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Настройки форума</h4>
              <div className="space-y-4 bg-dark-bg p-4 rounded-lg">
                <div>
                  <label className="block text-gray-400 mb-2">Название форума</label>
                  <Input 
                    type="text" 
                    defaultValue="Форум" 
                    className="w-full bg-secondary-bg border-divider" 
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Описание</label>
                  <textarea 
                    rows={3} 
                    className="w-full bg-secondary-bg border border-divider rounded-lg px-4 py-2 focus:outline-none focus:border-bright-blue-gray resize-none"
                    defaultValue="Современный форум для общения и обсуждения"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-gray-400 mb-2">Регистрация новых пользователей</label>
                    <div className="flex items-center">
                      <input type="radio" id="registration-enabled" name="registration" defaultChecked className="mr-2" />
                      <label htmlFor="registration-enabled" className="mr-4">Включена</label>
                      <input type="radio" id="registration-disabled" name="registration" className="mr-2" />
                      <label htmlFor="registration-disabled">Отключена</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Модерация публикаций</label>
                    <div className="flex items-center">
                      <input type="radio" id="moderation-enabled" name="moderation" defaultChecked className="mr-2" />
                      <label htmlFor="moderation-enabled" className="mr-4">Включена</label>
                      <input type="radio" id="moderation-disabled" name="moderation" className="mr-2" />
                      <label htmlFor="moderation-disabled">Отключена</label>
                    </div>
                  </div>
                </div>
              </div>
              <Button className="mt-4 bg-bright-blue-gray hover:bg-opacity-80">
                Сохранить настройки
              </Button>
            </div>
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="content-moderation">
            <div className="bg-dark-bg p-4 rounded-lg mb-4">
              <h4 className="text-lg font-medium mb-3">Ожидающие проверки</h4>
              <div className="space-y-4">
                <div className="border border-divider rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <UserAvatar 
                        user={{ username: "Владимир92" }} 
                        className="w-6 h-6 rounded-full mr-2" 
                      />
                      <span>Владимир92</span>
                    </div>
                    <span className="text-sm text-gray-400">Сегодня, 10:23</span>
                  </div>
                  <p className="mb-2">Всем привет! Хотел поделиться интересной статьей по программированию.</p>
                  <div className="flex justify-end space-x-2">
                    <Button className="bg-mod-green text-white rounded-lg">
                      <Check className="mr-1 h-4 w-4" />
                      Одобрить
                    </Button>
                    <Button className="bg-admin-red text-white rounded-lg">
                      <X className="mr-1 h-4 w-4" />
                      Отклонить
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-bg p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-3">Жалобы</h4>
              <div className="space-y-4">
                <div className="border border-divider rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <span className="mr-2">Жалоба от:</span>
                      <UserAvatar 
                        user={{ username: "ТехМодератор" }} 
                        className="w-6 h-6 rounded-full mr-2" 
                      />
                      <span>ТехМодератор</span>
                    </div>
                    <span className="text-sm text-gray-400">Сегодня, 09:15</span>
                  </div>
                  <div className="mb-2 border-l-4 border-admin-red pl-3 py-1">
                    <p>Неуважительное поведение в теме "Вопрос о работе форума". Пользователь нарушает правила.</p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button className="bg-blue-gray text-white rounded-lg">
                      <Eye className="mr-1 h-4 w-4" />
                      Просмотреть
                    </Button>
                    <Button className="bg-admin-red text-white rounded-lg">
                      <Ban className="mr-1 h-4 w-4" />
                      Заблокировать
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}