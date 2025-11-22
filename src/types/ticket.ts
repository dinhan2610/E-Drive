// Ticket module types
export type TicketType = 'FEEDBACK' | 'COMPLAINT';

export type TicketStatus = 
  | 'NEW'
  | 'IN_REVIEW'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketChannel = 'WEB' | 'DEALER' | 'CALLCENTER' | 'CHATBOT';

export type TicketCategory = 
  | 'PRODUCT'
  | 'DELIVERY'
  | 'PAYMENT'
  | 'WARRANTY'
  | 'SERVICE'
  | 'OTHER';

export interface Ticket {
  id: string;
  code: string;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  channel: TicketChannel;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  dealerName?: string;
  orderCode?: string;
  assigneeId?: string;
  assigneeName?: string;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  senderName: string;
  text: string;
  attachments?: string[];
  createdAt: string;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  type: 'STATUS_CHANGE' | 'ASSIGN' | 'COMMENT' | 'UPDATE';
  description: string;
  by: string;
  at: string;
}

export interface TicketStats {
  new: number;
  inReview: number;
  resolved: number;
  closed: number;
  total: number;
}
