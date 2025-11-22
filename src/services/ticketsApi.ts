// import apiClient from '../lib/apiClient';
import type { Ticket, TicketMessage, TicketHistory, TicketStats } from '../types/ticket';

export interface TicketListParams {
  search?: string;
  status?: string[];
  type?: string;
  priority?: string[];
  channel?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest' | 'priority' | 'sla';
}

// Mock Data
const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    code: 'TK001',
    type: 'COMPLAINT',
    title: 'Xe giao chậm so với hợp đồng',
    description: 'Tôi đặt xe từ tháng trước nhưng đến nay vẫn chưa được giao. Đại lý hứa giao trong 2 tuần nhưng đã quá 1 tháng rồi.',
    status: 'NEW',
    priority: 'HIGH',
    category: 'DELIVERY',
    channel: 'WEB',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0912345678',
    customerEmail: 'nguyenvana@gmail.com',
    orderCode: 'ORD001',
    slaDeadline: '2025-11-02T00:00:00Z',
    createdAt: '2025-10-30T10:30:00Z',
    updatedAt: '2025-10-30T10:30:00Z',
  },
  {
    id: '2',
    code: 'TK002',
    type: 'FEEDBACK',
    title: 'Nhân viên tư vấn nhiệt tình',
    description: 'Tôi rất hài lòng với dịch vụ tư vấn của anh Minh. Rất nhiệt tình và chi tiết.',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    category: 'SERVICE',
    channel: 'DEALER',
    customerName: 'Trần Thị B',
    customerPhone: '0923456789',
    customerEmail: 'tranthib@gmail.com',
    dealerName: 'Đại lý Hà Nội',
    assigneeId: 'agent1',
    assigneeName: 'Lê Văn C',
    slaDeadline: '2025-11-01T00:00:00Z',
    createdAt: '2025-10-29T14:20:00Z',
    updatedAt: '2025-10-30T09:15:00Z',
  },
  {
    id: '3',
    code: 'TK003',
    type: 'COMPLAINT',
    title: 'Xe có tiếng kêu lạ ở động cơ',
    description: 'Xe mới lấy được 1 tuần nhưng phát hiện có tiếng kêu lạ ở khu vực động cơ khi khởi động.',
    status: 'WAITING_CUSTOMER',
    priority: 'URGENT',
    category: 'PRODUCT',
    channel: 'CALLCENTER',
    customerName: 'Phạm Văn D',
    customerPhone: '0934567890',
    customerEmail: 'phamvand@gmail.com',
    orderCode: 'ORD002',
    assigneeId: 'agent2',
    assigneeName: 'Nguyễn Thị E',
    slaDeadline: '2025-10-31T00:00:00Z',
    createdAt: '2025-10-28T08:45:00Z',
    updatedAt: '2025-10-30T11:00:00Z',
  },
  {
    id: '4',
    code: 'TK004',
    type: 'COMPLAINT',
    title: 'Chưa nhận được hoá đơn VAT',
    description: 'Đã thanh toán đầy đủ từ 2 tuần trước nhưng chưa nhận được hoá đơn VAT như đại lý hứa.',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    category: 'PAYMENT',
    channel: 'WEB',
    customerName: 'Hoàng Thị F',
    customerPhone: '0945678901',
    customerEmail: 'hoangthif@gmail.com',
    orderCode: 'ORD003',
    assigneeId: 'agent1',
    assigneeName: 'Lê Văn C',
    slaDeadline: '2025-10-30T00:00:00Z',
    createdAt: '2025-10-25T16:30:00Z',
    updatedAt: '2025-10-29T14:20:00Z',
    resolvedAt: '2025-10-29T14:20:00Z',
  },
  {
    id: '5',
    code: 'TK005',
    type: 'FEEDBACK',
    title: 'Showroom sạch sẽ, thoáng mát',
    description: 'Showroom rất đẹp, nhân viên chuyên nghiệp. Tôi sẽ giới thiệu bạn bè đến.',
    status: 'CLOSED',
    priority: 'LOW',
    category: 'SERVICE',
    channel: 'CHATBOT',
    customerName: 'Đỗ Văn G',
    customerPhone: '0956789012',
    customerEmail: 'dovang@gmail.com',
    assigneeId: 'agent3',
    assigneeName: 'Vũ Thị H',
    slaDeadline: '2025-10-28T00:00:00Z',
    createdAt: '2025-10-20T11:00:00Z',
    updatedAt: '2025-10-21T10:30:00Z',
    resolvedAt: '2025-10-21T10:30:00Z',
  },
  {
    id: '6',
    code: 'TK006',
    type: 'COMPLAINT',
    title: 'Phụ kiện đi kèm thiếu so với hợp đồng',
    description: 'Theo hợp đồng có kèm thảm lót sàn và camera hành trình nhưng khi nhận xe không thấy.',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    category: 'DELIVERY',
    channel: 'DEALER',
    customerName: 'Lý Thị I',
    customerPhone: '0967890123',
    customerEmail: 'lythii@gmail.com',
    orderCode: 'ORD004',
    dealerName: 'Đại lý Hồ Chí Minh',
    assigneeId: 'agent2',
    assigneeName: 'Nguyễn Thị E',
    slaDeadline: '2025-11-01T00:00:00Z',
    createdAt: '2025-10-27T13:45:00Z',
    updatedAt: '2025-10-30T08:20:00Z',
  },
  {
    id: '7',
    code: 'TK007',
    type: 'FEEDBACK',
    title: 'Quy trình bảo hành rõ ràng',
    description: 'Tôi vừa đi bảo hành định kỳ, quy trình rất nhanh gọn và minh bạch. Cảm ơn đội ngũ kỹ thuật.',
    status: 'RESOLVED',
    priority: 'LOW',
    category: 'WARRANTY',
    channel: 'WEB',
    customerName: 'Bùi Văn K',
    customerPhone: '0978901234',
    customerEmail: 'buivank@gmail.com',
    assigneeId: 'agent3',
    assigneeName: 'Vũ Thị H',
    slaDeadline: '2025-10-29T00:00:00Z',
    createdAt: '2025-10-26T09:15:00Z',
    updatedAt: '2025-10-28T15:40:00Z',
    resolvedAt: '2025-10-28T15:40:00Z',
  },
  {
    id: '8',
    code: 'TK008',
    type: 'COMPLAINT',
    title: 'Màu xe không đúng với đơn hàng',
    description: 'Tôi đặt màu xanh navy nhưng xe giao đến là màu xanh ngọc. Yêu cầu đổi xe.',
    status: 'NEW',
    priority: 'URGENT',
    category: 'PRODUCT',
    channel: 'CALLCENTER',
    customerName: 'Võ Thị L',
    customerPhone: '0989012345',
    customerEmail: 'vothil@gmail.com',
    orderCode: 'ORD005',
    slaDeadline: '2025-11-03T00:00:00Z',
    createdAt: '2025-10-30T15:20:00Z',
    updatedAt: '2025-10-30T15:20:00Z',
  },
];

// List tickets with filters
export const listTickets = async (params: TicketListParams) => {
  // Mock implementation - trả về data giả
  await new Promise(resolve => setTimeout(resolve, 500)); // Giả lập delay
  
  let filtered = [...MOCK_TICKETS];
  
  // Filter by status
  if (params.status && params.status.length > 0) {
    filtered = filtered.filter(t => params.status!.includes(t.status));
  }
  
  // Filter by type
  if (params.type) {
    filtered = filtered.filter(t => t.type === params.type);
  }
  
  // Filter by priority
  if (params.priority && params.priority.length > 0) {
    filtered = filtered.filter(t => params.priority!.includes(t.priority));
  }
  
  // Search by title, customer name, code
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchLower) ||
      t.customerName.toLowerCase().includes(searchLower) ||
      t.code.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort
  if (params.sort === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (params.sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  return { items: filtered, total: filtered.length };
  
  // Real API implementation (commented out)
  // const response = await apiClient.get('/api/tickets', { params });
  // return response.data as { items: Ticket[]; total: number };
};

// Get single ticket detail
export const getTicket = async (id: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  const ticket = MOCK_TICKETS.find(t => t.id === id);
  if (!ticket) throw new Error('Ticket not found');
  return ticket;
  
  // Real API (commented out)
  // const response = await apiClient.get(`/api/tickets/${id}`);
  // return response.data as Ticket;
};

// Create new ticket
export const createTicket = async (body: Partial<Ticket>) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  const newTicket: Ticket = {
    id: String(MOCK_TICKETS.length + 1),
    code: `TK${String(MOCK_TICKETS.length + 1).padStart(3, '0')}`,
    type: body.type || 'FEEDBACK',
    title: body.title || '',
    description: body.description || '',
    status: 'NEW',
    priority: body.priority || 'MEDIUM',
    category: body.category || 'OTHER',
    channel: body.channel || 'WEB',
    customerName: body.customerName || '',
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail,
    orderCode: body.orderCode,
    slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_TICKETS.push(newTicket);
  return newTicket;
  
  // Real API (commented out)
  // const response = await apiClient.post('/api/tickets', body);
  // return response.data as Ticket;
};

// Update ticket
export const updateTicket = async (id: string, body: Partial<Ticket>) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Ticket not found');
  
  MOCK_TICKETS[index] = {
    ...MOCK_TICKETS[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  return MOCK_TICKETS[index];
  
  // Real API (commented out)
  // const response = await apiClient.put(`/api/tickets/${id}`, body);
  // return response.data as Ticket;
};

// Change ticket status
export const changeStatus = async (id: string, status: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Ticket not found');
  
  MOCK_TICKETS[index].status = status as any;
  MOCK_TICKETS[index].updatedAt = new Date().toISOString();
  
  if (status === 'RESOLVED' || status === 'CLOSED') {
    MOCK_TICKETS[index].resolvedAt = new Date().toISOString();
  }
  
  return MOCK_TICKETS[index];
  
  // Real API (commented out)
  // const response = await apiClient.patch(`/api/tickets/${id}/status`, { status });
  // return response.data as Ticket;
};

// Assign agent to ticket
export const assignAgent = async (id: string, assigneeId: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Ticket not found');
  
  MOCK_TICKETS[index].assigneeId = assigneeId;
  MOCK_TICKETS[index].assigneeName = `Agent ${assigneeId}`;
  MOCK_TICKETS[index].updatedAt = new Date().toISOString();
  
  return MOCK_TICKETS[index];
  
  // Real API (commented out)
  // const response = await apiClient.patch(`/api/tickets/${id}/assignee`, { assigneeId });
  // return response.data as Ticket;
};

// List messages in ticket
export const listMessages = async (_id: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  return [] as TicketMessage[];
  
  // Real API (commented out)
  // const response = await apiClient.get(`/api/tickets/${id}/messages`);
  // return response.data as TicketMessage[];
};

// Send message to ticket
export const sendMessage = async (id: string, data: { text: string; files?: File[] }) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 400));
  const message: TicketMessage = {
    id: String(Date.now()),
    ticketId: id,
    sender: 'AGENT',
    senderName: 'Current User',
    text: data.text,
    createdAt: new Date().toISOString(),
  };
  return message;
  
  // Real API (commented out)
  // const formData = new FormData();
  // formData.append('text', data.text);
  // if (data.files) {
  //   data.files.forEach((file) => formData.append('files', file));
  // }
  // const response = await apiClient.post(`/api/tickets/${id}/messages`, formData, {
  //   headers: { 'Content-Type': 'multipart/form-data' },
  // });
  // return response.data as TicketMessage;
};

// List history of ticket
export const listHistory = async (_id: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  return [] as TicketHistory[];
  
  // Real API (commented out)
  // const response = await apiClient.get(`/api/tickets/${id}/history`);
  // return response.data as TicketHistory[];
};

// Delete ticket
export const removeTicket = async (id: string) => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 400));
  const index = MOCK_TICKETS.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Ticket not found');
  MOCK_TICKETS.splice(index, 1);
  
  // Real API (commented out)
  // await apiClient.delete(`/api/tickets/${id}`);
};

// Bulk update tickets
export const bulkUpdate = async (ids: string[], action: 'CLOSE' | 'RESOLVE' | 'REOPEN') => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  ids.forEach(id => {
    const index = MOCK_TICKETS.findIndex(t => t.id === id);
    if (index !== -1) {
      if (action === 'CLOSE') MOCK_TICKETS[index].status = 'CLOSED';
      if (action === 'RESOLVE') MOCK_TICKETS[index].status = 'RESOLVED';
      if (action === 'REOPEN') MOCK_TICKETS[index].status = 'IN_REVIEW';
      MOCK_TICKETS[index].updatedAt = new Date().toISOString();
    }
  });
  return { success: true, updated: ids.length };
  
  // Real API (commented out)
  // const response = await apiClient.post('/api/tickets/bulk', { ids, action });
  // return response.data;
};

// Get ticket stats
export const getStats = async () => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 300));
  const stats: TicketStats = {
    total: MOCK_TICKETS.length,
    new: MOCK_TICKETS.filter(t => t.status === 'NEW').length,
    inReview: MOCK_TICKETS.filter(t => t.status === 'IN_REVIEW').length,
    resolved: MOCK_TICKETS.filter(t => t.status === 'RESOLVED').length,
    closed: MOCK_TICKETS.filter(t => t.status === 'CLOSED').length,
  };
  return stats;
  
  // Real API (commented out)
  // const response = await apiClient.get('/api/tickets/stats');
  // return response.data as TicketStats;
};
