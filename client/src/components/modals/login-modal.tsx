import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "../forms/login-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onShowRegister: () => void;
};

export function LoginModal({ isOpen, onClose, onShowRegister }: LoginModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary-bg border-divider text-white max-w-md w-[95%] p-3 sm:p-6">
        <DialogHeader className="flex justify-between items-center mb-3 sm:mb-6">
          <DialogTitle className="text-lg sm:text-xl font-sans font-bold">
            Вход на форум
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
        
        <LoginForm onSuccess={onClose} onShowRegister={onShowRegister} />
      </DialogContent>
    </Dialog>
  );
}
