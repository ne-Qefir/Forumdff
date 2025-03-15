import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditProfileForm } from "../forms/edit-profile-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-secondary-bg border-divider text-white max-w-xl w-[95%] p-3 sm:p-6">
        <DialogHeader className="flex justify-between items-center mb-3 sm:mb-6">
          <DialogTitle className="text-lg sm:text-xl font-sans font-bold">
            Редактирование профиля
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
        
        <EditProfileForm onSuccess={onClose} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
