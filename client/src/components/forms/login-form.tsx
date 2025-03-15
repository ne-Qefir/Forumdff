import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema, UserLogin } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

type LoginFormProps = {
  onSuccess?: () => void;
  onShowRegister: () => void;
};

export function LoginForm({ onSuccess, onShowRegister }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<UserLogin>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: UserLogin) => {
    await loginMutation.mutateAsync(data);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Введите email"
                  className="bg-dark-bg border-divider"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">Пароль</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Введите пароль"
                  className="bg-dark-bg border-divider"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox 
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="mr-2"
            />
            <label 
              htmlFor="remember-me" 
              className="text-gray-400 text-sm cursor-pointer"
            >
              Запомнить меня
            </label>
          </div>
          <a href="#" className="text-bright-blue-gray hover:underline text-sm">
            Забыли пароль?
          </a>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-bright-blue-gray hover:bg-opacity-80 text-white"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Вход...
            </>
          ) : (
            "Войти"
          )}
        </Button>

        <p className="text-center mt-4 text-gray-400">
          Нет аккаунта?{" "}
          <Button 
            type="button"
            variant="link" 
            className="text-bright-blue-gray hover:underline p-0"
            onClick={onShowRegister}
          >
            Зарегистрироваться
          </Button>
        </p>
      </form>
    </Form>
  );
}
