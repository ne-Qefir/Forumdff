import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  user: {
    username: string;
    avatar?: string;
  };
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = user.username
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);

  // Добавляем проверку на полный URL для аватарки
  const avatarUrl = user.avatar ? (
    user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}${user.avatar}`
  ) : undefined;

  return (
    <Avatar className={cn("border border-divider", className)}>
      <AvatarImage src={avatarUrl} alt={user.username} />
      <AvatarFallback className="bg-blue-gray text-white font-semibold text-xs md:text-sm">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}