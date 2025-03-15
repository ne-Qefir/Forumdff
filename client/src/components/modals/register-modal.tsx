import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegisterForm } from "../forms/register-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type RegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onShowLogin: () => void;
};

export function RegisterModal({ isOpen, onClose, onShowLogin }: RegisterModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary-bg border-divider text-white max-w-md w-[95%] p-3 sm:p-6">
        <DialogHeader className="flex justify-between items-center mb-3 sm:mb-6">
          <DialogTitle className="text-lg sm:text-xl font-sans font-bold">
            Регистрация на форуме
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
        
        <RegisterForm onSuccess={onClose} onShowLogin={onShowLogin} />
      </DialogContent>
    </Dialog>
  );
}
