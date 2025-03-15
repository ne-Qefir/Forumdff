import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/forms/login-form";
import { RegisterForm } from "@/components/forms/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, LogIn } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bright-blue-gray"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-bg">
      {/* Left panel - Auth forms */}
      <div className="md:w-1/2 p-6 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-sans font-bold text-bright-blue-gray mb-2">
              Форум
            </h1>
            <p className="text-gray-400">
              Присоединяйтесь к обсуждениям или создайте свою тему
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Регистрация
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm 
                onShowRegister={() => setActiveTab("register")} 
              />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm 
                onShowLogin={() => setActiveTab("login")} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right panel - Hero image/info */}
      <div className="md:w-1/2 bg-secondary-bg p-6 flex items-center justify-center">
        <div className="max-w-lg text-center md:text-left">
          <h2 className="text-3xl font-sans font-bold mb-4">
            Добро пожаловать на форум
          </h2>
          <p className="text-xl mb-6 text-gray-300">
            Место для обсуждения интересных тем и обмена опытом
          </p>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start text-left">
              <div className="bg-blue-gray rounded-full p-3 mb-4 md:mb-0 md:mr-4">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Создайте аккаунт</h3>
                <p className="text-gray-400">
                  Регистрация на форуме займет всего минуту и даст вам доступ ко всем функциям
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start text-left">
              <div className="bg-blue-gray rounded-full p-3 mb-4 md:mb-0 md:mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Присоединяйтесь к обсуждениям</h3>
                <p className="text-gray-400">
                  Участвуйте в существующих темах или создавайте свои собственные
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start text-left">
              <div className="bg-blue-gray rounded-full p-3 mb-4 md:mb-0 md:mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Получите роль и статус</h3>
                <p className="text-gray-400">
                  Активные пользователи могут получить дополнительные возможности и статус на форуме
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
