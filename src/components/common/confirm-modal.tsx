"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  isLoading?: boolean;
}

const variantConfig = {
  default: {
    icon: Info,
    iconColor: "text-blue-600",
    confirmVariant: "default" as const,
  },
  destructive: {
    icon: XCircle,
    iconColor: "text-red-600",
    confirmVariant: "destructive" as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    confirmVariant: "default" as const,
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-yellow-600",
    confirmVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    confirmVariant: "default" as const,
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base mt-3 text-right">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button
            onClick={handleConfirm}
            variant={config.confirmVariant}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {isLoading ? "جاري التحميل..." : confirmText}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "success" | "warning" | "info";
  }>({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirm = (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "success" | "warning" | "info";
  }) => {
    setConfig(options);
    setIsOpen(true);
  };

  const closeConfirm = () => {
    setIsOpen(false);
  };

  const ConfirmModalComponent = (props?: { isLoading?: boolean }) => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={closeConfirm}
      onConfirm={config.onConfirm}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      isLoading={props?.isLoading}
    />
  );

  return {
    openConfirm,
    closeConfirm,
    ConfirmModal: ConfirmModalComponent,
    isOpen,
  };
}