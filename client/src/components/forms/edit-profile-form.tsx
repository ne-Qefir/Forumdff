import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera } from "lucide-react";
import { z } from "zod";

type EditProfileFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

const editProfileSchema = z.object({
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов"),
  bio: z.string().optional(),
  avatar: z.instanceof(File).optional(),
  notifyReplies: z.boolean().default(true),
  notifyMessages: z.boolean().default(true),
  notifyMentions: z.boolean().default(true),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileForm({ onSuccess, onCancel }: EditProfileFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      notifyReplies: true,
      notifyMessages: true,
      notifyMentions: true,
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("avatar", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("username", data.username);
      if (data.bio) formData.append("bio", data.bio);
      if (data.avatar) formData.append("avatar", data.avatar);

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Ошибка при обновлении профиля");
      }

      const updatedUser = await response.json();
      
      // Update user in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Успех",
        description: "Профиль успешно обновлен",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-bright-blue-gray">
              {avatarPreview ? (
                <img 
                  src={avatarPreview}
                  alt="Аватар пользователя" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-blue-gray flex items-center justify-center text-2xl text-white">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              className="absolute bottom-0 right-0 bg-bright-blue-gray hover:bg-opacity-80 rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-sm text-gray-400">Нажмите на иконку камеры для изменения аватара</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-400">Имя пользователя</FormLabel>
                <FormControl>
                  <Input
                    className="w-full bg-dark-bg border-divider"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {user && (
            <div>
              <FormLabel className="text-gray-400">Email</FormLabel>
              <Input
                value={user.email}
                disabled
                className="w-full bg-dark-bg border-divider"
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-400">О себе</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Расскажите о себе..."
                  className="w-full bg-dark-bg border-divider resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel className="text-gray-400 mb-2 block">Настройки уведомлений</FormLabel>
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="notifyReplies"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    Уведомлять о новых ответах
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notifyMessages"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    Уведомлять о личных сообщениях
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notifyMentions"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    Уведомлять об упоминаниях
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button 
            type="button" 
            variant="outline"
            className="bg-dark-bg hover:bg-secondary-bg border-none"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            className="bg-bright-blue-gray hover:bg-opacity-80" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить изменения"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
