// Mobile app specific types

export interface FormErrors {
  drink?: string;
  rating?: string;
  review?: string;
}

export interface LoadingState {
  isSubmitting: boolean;
  isUploading: boolean;
}
