import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { UserAvatar } from "./user-avatar";
import { RoleBadge } from "./role-badge";
import { Topic } from "@shared/schema";
import { Heart, Share2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type TopicCardProps = {
  topic: Topic & { 
    author: { 
      id: number; 
      username: string; 
      role: string; 
      avatar?: string;
    } | null 
  };
};

export function TopicCard({ topic }: TopicCardProps) {
  const [, setLocation] = useLocation();
  const [isLiked, setIsLiked] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/topics/" + topic.id);
    alert("Ссылка скопирована в буфер обмена");
  };

  const formattedDate = topic.createdAt
    ? formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: ru })
    : "";

  return (
    <Card variant="shine" className="mb-4 sm:mb-6 overflow-hidden group cursor-pointer transition-all hover:transform hover:scale-[1.02] bg-card hover:bg-accent" onClick={() => setLocation(`/topics/${topic.id}`)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-divider">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 sm:mr-4">
              <UserAvatar 
                user={{
                  username: topic.author?.username || "Удаленный пользователь",
                  avatar: topic.author?.avatar
                }} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-1 sm:mb-2">
                <h3 className="text-base sm:text-xl font-sans font-semibold hover:text-bright-blue-gray truncate pr-2">
                  {topic.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center flex-wrap">
                  <span className="truncate max-w-[100px] sm:max-w-full">
                    {topic.author?.username || "Удаленный пользователь"}
                  </span>
                  {topic.author && (
                    <RoleBadge role={topic.author.role} showText />
                  )}
                </span>
                <span className="mx-2">•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-3 sm:p-4">
          <p className="mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base break-words">
            {topic.content}
          </p>
          {topic.image && (
            <img 
              src={topic.image} 
              alt={topic.title}
              className="rounded-md w-full h-48 object-cover mb-3 sm:mb-4" 
            />
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="flame"
                size="sm"
                className="text-muted-foreground hover:text-bright-blue-gray"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked(!isLiked);
                }}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-bright-blue-gray' : ''}`} />
                <span className="ml-1">{topic.likesCount || 0}</span>
              </Button>
              <Button
                variant="flame"
                size="sm"
                className="text-muted-foreground hover:text-bright-blue-gray"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="shine"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Читать дальше
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}