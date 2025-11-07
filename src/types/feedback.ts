export interface Feedback {
  feedbackId: number;
  customerId: number;
  dealerId: number;
  rating: number;
  content: string;
  createdAt: string;
  customerName?: string;
  dealerName?: string;
  response?: string;
  respondedAt?: string;
  status?: 'pending' | 'responded' | 'resolved';
}

export interface FeedbackListResponse {
  content: Feedback[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FeedbackFilters {
  page?: number;
  size?: number;
  rating?: number;
  dealerId?: number;
  customerId?: number;
  status?: string;
}
