import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTopicSchema, InsertTopic, topicCategories } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";
import { z } from "zod";

type CreateTopicFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

const createTopicSchema = insertTopicSchema.extend({
  image: z.instanceof(File).optional(),
  attachment: z.instanceof(File).optional(),
});

type CreateTopicFormValues = z.infer<typeof createTopicSchema>;

export function CreateTopicForm({ onSuccess, onCancel }: CreateTopicFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateTopicFormValues>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "Общие обсуждения",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("attachment", file);
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: CreateTopicFormValues) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны войти в систему для создания темы",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("category", data.category);

      if (data.image) {
        formData.append("image", data.image);
      }
      if (data.attachment) {
        formData.append("attachment", data.attachment);
      }

      const response = await fetch("/api/topics", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Неизвестная ошибка при создании темы");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });

      toast({
        title: "Успех",
        description: "Тема успешно создана",
        variant: "default",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({
        title: "Ошибка при создании темы",
        description: error instanceof Error ? error.message : "Не удалось создать тему. Пожалуйста, проверьте введенные данные и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-gray-400">Название темы</FormLabel>
              <FormControl>
                <Input
                  placeholder="Введите название темы"
                  className="w-full bg-dark-bg border-divider"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-gray-400">Категория</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full bg-dark-bg border-divider shine-effect">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-secondary-bg border-divider">
                  {topicCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="block text-gray-400">Содержание</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Введите содержание темы..."
                  className="w-full bg-dark-bg border-divider resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="block text-gray-400">Медиафайлы</FormLabel>
          <div
            className="border-2 border-dashed border-blue-gray rounded-lg p-5 text-center cursor-pointer hover:border-bright-blue-gray hover:bg-blue-gray/10 transition duration-200"
          >
            <UploadCloud className="h-12 w-12 mx-auto mb-2 text-blue-gray" />
            <p className="text-gray-400">Перетащите файлы сюда или нажмите для выбора</p>
            <input
              type="file"
              ref={imageInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
            />
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant="flame"
                onClick={() => imageInputRef.current?.click()}
                className="w-full"
              >
                {selectedImage ? "Изменить изображение" : "Загрузить изображение"}
              </Button>
              <Button
                type="button"
                variant="flame"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                {selectedFile ? selectedFile.name : "Прикрепить файл"}
              </Button>
            </div>
          </div>
          {selectedImage && (
            <div className="mt-3">
              <img
                src={selectedImage}
                alt="Предпросмотр"
                className="max-w-full max-h-[200px] rounded-md mx-auto"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="flame"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="flame"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              "Создать тему"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}