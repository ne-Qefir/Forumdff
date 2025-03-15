import { UserRole } from "@shared/schema";
import { Crown, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleBadgeProps = {
  role: string;
  showText?: boolean;
  className?: string;
};

export function RoleBadge({ role, showText = false, className }: RoleBadgeProps) {
  let bgColor = "";
  let icon = null;
  let text = "";
  let shortText = "";

  switch (role) {
    case UserRole.ADMIN:
      bgColor = "bg-admin-red";
      icon = <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />;
      text = "Администратор";
      shortText = "Админ";
      break;
    case UserRole.MODERATOR:
      bgColor = "bg-mod-green";
      icon = <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />;
      text = "Модератор";
      shortText = "Модер";
      break;
    default:
      bgColor = "bg-user-gray";
      icon = <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />;
      text = "Пользователь";
      shortText = "Польз.";
  }

  return (
    <span 
      className={cn(
        "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium text-white shadow-sm",
        "ring-1 ring-white/70",
        bgColor,
        className
      )}
    >
      {icon}
      {showText && (
        <>
          <span className="ml-1 hidden md:inline-block">{text}</span>
          <span className="ml-1 inline-block md:hidden">{shortText}</span>
        </>
      )}
    </span>
  );
}
