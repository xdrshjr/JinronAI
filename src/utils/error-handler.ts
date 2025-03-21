import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown) => {
  console.error('Error:', error);
  
  if (error instanceof AppError) {
    toast.error(error.message, {
      description: `错误代码: ${error.code}`,
    });
    return;
  }
  
  if (error instanceof Error) {
    toast.error('操作失败', {
      description: error.message,
    });
    return;
  }
  
  toast.error('未知错误', {
    description: '发生了一个意外的错误，请稍后重试。',
  });
};

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
}; 