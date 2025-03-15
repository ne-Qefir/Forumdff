import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Topic } from "@shared/schema";
import { UserAvatar } from "@/components/forum/user-avatar";
import { RoleBadge } from "@/components/forum/role-badge";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Download, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TopicPage() {
  const [, params] = useRoute("/topics/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const { data: topic, isLoading } = useQuery<Topic & {
    author: {
      id: number;
      username: string;
      role: string;
      avatar?: string;
    };
    comments: Array<{
      id: number;
      content: string;
      author: {
        id: number;
        username: string;
        role: string;
        avatar?: string;
      };
      createdAt: string;
    }>;
  }>({
    queryKey: [`/api/topics/${params?.id}`],
    enabled: !!params?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/topics/${params?.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${params?.id}`] });
      setComment("");
      toast({
        title: "Комментарий добавлен",
        description: "Ваш комментарий успешно добавлен к теме",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось добавить комментарий",
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        return apiRequest("DELETE", `/api/topics/${params?.id}/like`);
      } else {
        return apiRequest("POST", `/api/topics/${params?.id}/like`);
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${params?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить лайк",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    await addCommentMutation.mutateAsync(comment);
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему, чтобы ставить лайки",
        variant: "destructive",
      });
      return;
    }
    await toggleLikeMutation.mutateAsync();
  };

  if (isLoading || !topic) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="shine"
        className="mb-6"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      <Card variant="flame" className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-4">
            <UserAvatar
              user={{
                username: topic.author?.username || "Удаленный пользователь",
                avatar: topic.author?.avatar,
              }}
              className="w-12 h-12"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{topic.author?.username}</span>
                {topic.author && <RoleBadge role={topic.author.role} showText />}
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(topic.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line mb-6">{topic.content}</p>
          
          {topic.image && (
            <img
              src={topic.image}
              alt={topic.title}
              className="rounded-lg max-h-96 w-full object-cover mb-6"
            />
          )}

          {topic.attachment && (
            <Button
              variant="shine"
              className="mb-6"
              onClick={() => window.open(topic.attachment, "_blank")}
            >
              <Download className="mr-2 h-4 w-4" />
              Скачать {topic.attachmentName || "файл"}
            </Button>
          )}

          <div className="flex items-center gap-4">
            <Button
              variant="flame"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-bright-blue-gray" : ""}
            >
              <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {topic.likesCount || 0} лайков
            </Button>
          </div>
        </CardContent>
      </Card>

      {user && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Написать комментарий..."
              className="mb-4"
            />
            <Button
              variant="shine"
              onClick={handleCommentSubmit}
              disabled={addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? "Отправка..." : "Отправить комментарий"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {topic.comments?.map((comment) => (
          <Card key={comment.id} variant="shine" className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <UserAvatar
                  user={{
                    username: comment.author.username,
                    avatar: comment.author.avatar,
                  }}
                  className="w-10 h-10"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{comment.author.username}</span>
                    <RoleBadge role={comment.author.role} />
                    <span className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
