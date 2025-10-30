import React, { useState, useEffect } from 'react';
import { listTickets, removeTicket } from '../services/ticketsApi';
import type { Ticket } from '../types/ticket';
import TicketDetailModal from '../components/tickets/TicketDetailModal';
import TicketEditModal from '../components/tickets/TicketEditModal';
import styles from '../styles/TicketsStyles/TicketsPage.module.scss';

const formatDate = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return datetime;
  }
};

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'NEW': return 'Mới';
    case 'IN_REVIEW': return 'Đang xem xét';
    case 'WAITING_CUSTOMER': return 'Chờ khách hàng';
    case 'RESOLVED': return 'Đã giải quyết';
    case 'CLOSED': return 'Đã đóng';
    case 'REJECTED': return 'Từ chối';
    default: return status;
  }
};

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const data = await listTickets({});
      setTickets(data.items);
    } catch (error) {
      console.error('Error loading tickets:', error);
      alert('❌ Không thể tải danh sách khiếu nại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ticket #${ticket.code} không?`)) return;
    
    try {
      await removeTicket(ticket.id);
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
      alert('✅ Đã xóa ticket thành công!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ ${error.message || 'Không thể xóa ticket'}`);
    }
  };

  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const handleEdit = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowEditModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updated: Ticket) => {
    setTickets(prev => prev.map(t => 
      t.id === updated.id ? updated : t
    ));
    loadTickets();
  };

  const filteredTickets = filterStatus === 'ALL' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fas fa-comments"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý phản hồi & khiếu nại</h1>
              <p>Theo dõi và xử lý toàn bộ phản hồi và khiếu nại từ khách hàng</p>
            </div>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả ({tickets.length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'NEW' ? styles.active : ''}`}
              onClick={() => setFilterStatus('NEW')}
            >
              Mới ({tickets.filter(t => t.status === 'NEW').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'IN_REVIEW' ? styles.active : ''}`}
              onClick={() => setFilterStatus('IN_REVIEW')}
            >
              Đang xử lý ({tickets.filter(t => t.status === 'IN_REVIEW').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'RESOLVED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('RESOLVED')}
            >
              Đã giải quyết ({tickets.filter(t => t.status === 'RESOLVED').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'CLOSED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('CLOSED')}
            >
              Đã đóng ({tickets.filter(t => t.status === 'CLOSED').length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại</th>
                  <th>Tiêu đề</th>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>#{ticket.code}</td>
                      <td>
                        <span className={`${styles.typeBadge} ${styles[ticket.type.toLowerCase()]}`}>
                          {ticket.type === 'FEEDBACK' ? 'Phản hồi' : 'Khiếu nại'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.titleInfo}>
                          <div className={styles.title}>{ticket.title}</div>
                        </div>
                      </td>
                      <td>{ticket.customerName}</td>
                      <td>
                        <div className={styles.contactInfo}>
                          {ticket.customerPhone && <div>{ticket.customerPhone}</div>}
                          {ticket.customerEmail && <div className={styles.email}>{ticket.customerEmail}</div>}
                        </div>
                      </td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[ticket.status.toLowerCase()]}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(ticket)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.edit}`}
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(ticket)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.delete}`}
                            title="Xóa"
                            onClick={() => handleDeleteTicket(ticket)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modals */}
        {showDetailModal && selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditFromDetail}
          />
        )}

        {showEditModal && selectedTicket && (
          <TicketEditModal
            ticket={selectedTicket}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
