import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getOrderById } from '../services/ordersApi';
import { createContract } from '../services/contractsApi';
import type { OrderLite } from '../types/order';
import type { ContractPayload } from '../types/contract';
import ContractForm from '../components/contracts/ContractForm';
import PdfPreview from '../components/contracts/PdfPreview';
import styles from './ContractCreatePage.module.scss';

const ContractCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedOrder, setSelectedOrder] = useState<OrderLite | null>(null);
  const [payload, setPayload] = useState<ContractPayload>({
    orderId: '',
    buyer: { name: '' },
    dealer: { id: '', name: '' },
    manufacturer: {
      name: 'E-DRIVE VIETNAM',
      address: '123 Đường Xe Điện, Quận 1, TP.HCM',
      phone: '(0123) 456 789',
      email: 'contact@e-drive.vn',
      taxCode: '0123456789',
    },
    vehicle: { model: '' },
    terms: {},
    pricing: {
      subtotal: 0,
      discount: 0,
      taxPercent: 10,
      fees: 0,
      total: 0,
      paidTotal: 0,
      remaining: 0,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load order from URL param
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      loadOrderById(orderId);
    }
  }, [searchParams]);

  const loadOrderById = async (id: string) => {
    try {
      const order = await getOrderById(id);
      handleOrderSelect(order);
    } catch (error: any) {
      showToast('error', error.message || 'Không thể tải đơn hàng');
    }
  };

  const handleOrderSelect = (order: OrderLite) => {
    setSelectedOrder(order);
    setPayload({
      orderId: order.id,
      order: order, // Add full order data
      buyer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: order.customer.address,
      },
      dealer: {
        id: order.dealer.id,
        name: order.dealer.name,
        // TODO: Lấy thông tin đầy đủ từ API dealer
        phone: '(028) 1234 5678',
        email: 'dealer@edrive.vn',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        taxCode: '0987654321',
        representative: 'Bà Trần Thị B',
      },
      manufacturer: {
        name: 'E-DRIVE VIETNAM',
        address: '123 Đường Xe Điện, Quận 1, TP.HCM',
        phone: '(0123) 456 789',
        email: 'contact@e-drive.vn',
        taxCode: '0123456789',
      },
      vehicle: {
        model: order.vehicle.model,
        variant: order.vehicle.variant,
        color: order.vehicle.color,
        vin: order.vehicle.vin,
      },
      terms: {},
      pricing: {
        subtotal: order.money.subtotal,
        discount: order.money.discount,
        taxPercent: order.money.taxPercent,
        fees: order.money.fees || 0,
        total: order.money.total,
        paidTotal: order.money.paidTotal,
        remaining: order.money.remaining,
      },
    });
    setErrors({});
  };

  const handlePayloadChange = (partial: Partial<ContractPayload>) => {
    setPayload((prev) => {
      const updated = { ...prev, ...partial };
      // Recompute total & remaining
      if (partial.pricing || partial.pricing === undefined) {
        const pricing = { ...prev.pricing, ...partial.pricing };
        const afterDiscount = pricing.subtotal - pricing.discount;
        const taxAmount = afterDiscount * (pricing.taxPercent / 100);
        pricing.total = afterDiscount + taxAmount + (pricing.fees || 0);
        pricing.remaining = pricing.total - (pricing.paidTotal || 0);
        updated.pricing = pricing;
      }
      return updated;
    });
  };

  const validatePayload = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!payload.buyer.name.trim()) {
      newErrors.buyerName = 'Vui lòng nhập tên người mua';
    }

    if (!payload.vehicle.model.trim()) {
      newErrors.vehicleModel = 'Vui lòng nhập model xe';
    }

    if (payload.pricing.subtotal <= 0) {
      newErrors.subtotal = 'Giá niêm yết phải lớn hơn 0';
    }

    if (payload.pricing.discount < 0 || payload.pricing.discount > payload.pricing.subtotal) {
      newErrors.discount = 'Giảm giá không hợp lệ';
    }

    if ((payload.pricing.remaining || 0) < 0) {
      newErrors.remaining = 'Số tiền còn lại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateContract = async () => {
    if (!validatePayload()) {
      showToast('error', 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    try {
      setLoading(true);
      const contract = await createContract(payload);
      setCreatedContractId(contract.id);
      showToast('success', `Đã tạo hợp đồng ${contract.id} thành công!`);
      
      // Navigate to contract detail (if exists)
      setTimeout(() => {
        // navigate(`/admin/contracts/${contract.id}`);
        // Or show success with option to create another
      }, 2000);
    } catch (error: any) {
      showToast('error', error.message || 'Không thể tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;

    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Tính toán kích thước ảnh theo mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 0;

      // Thêm trang đầu tiên
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      pageCount++;

      // Thêm các trang tiếp theo
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        pageCount++;
      }

      console.log(`PDF exported with ${pageCount} pages`);
      pdf.save(`hop-dong-${createdContractId || payload.orderId || 'draft'}.pdf`);
      showToast('success', `Đã tải PDF thành công (${pageCount} trang)!`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showToast('error', 'Không thể xuất PDF. Vui lòng thử lại.');
    }
  };

  const isFormValid = selectedOrder && payload.buyer.name && payload.vehicle.model && payload.pricing.subtotal > 0;

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className={styles.toastClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              <i className="fas fa-file-contract"></i>
              Tạo hợp đồng mua bán
            </h1>
            <p className={styles.pageSubtitle}>
              {!selectedOrder 
                ? 'Vui lòng chọn đơn hàng từ danh sách để tạo hợp đồng'
                : `Đang tạo hợp đồng cho đơn hàng ${selectedOrder.code}`
              }
            </p>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate('/admin')}
            >
              <i className="fas fa-arrow-left"></i>
              Quay lại
            </button>
          </div>
        </header>

        {/* Main Content */}
        {!selectedOrder ? (
          // No order selected - show message
          <div className={styles.noOrderState}>
            <div className={styles.emptyBox}>
              <i className="fas fa-clipboard-list"></i>
              <h2>Chưa chọn đơn hàng</h2>
              <p>Vui lòng quay lại danh sách đơn hàng và click vào icon "Tạo hợp đồng" để bắt đầu</p>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate('/admin')}
              >
                <i className="fas fa-list"></i>
                Đến danh sách đơn hàng
              </button>
            </div>
          </div>
        ) : (
          // Order selected - show form (full width, no right column)
          <div className={styles.fullWidthLayout}>
            {/* Form Content - Full Width Single Column */}
            <div className={styles.formContainer}>
              <ContractForm
                payload={payload}
                onChange={handlePayloadChange}
                errors={errors}
                orderData={selectedOrder}
              />
            </div>

            {/* Actions Bar - Full Width */}
            <div className={styles.actionsBar}>
              <div className={styles.actionsLeft}>
                <button
                  className={styles.btnPreview}
                  onClick={() => setShowPreviewModal(true)}
                  disabled={!isFormValid}
                >
                  <i className="fas fa-eye"></i>
                  Xem trước hợp đồng
                </button>
              </div>

              <div className={styles.actionsRight}>
                <button
                  className={styles.btnPrimary}
                  onClick={handleCreateContract}
                  disabled={!isFormValid || loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Tạo hợp đồng
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className={styles.previewModal} onClick={() => setShowPreviewModal(false)}>
          <div className={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <h2>
                <i className="fas fa-file-contract"></i>
                Xem trước hợp đồng
              </h2>
              <div className={styles.headerActions}>
                <button className={styles.exportBtn} onClick={handleExportPdf}>
                  <i className="fas fa-download"></i>
                  Tải PDF
                </button>
                <button 
                  className={styles.previewModalClose}
                  onClick={() => setShowPreviewModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className={styles.previewModalBody}>
              <PdfPreview ref={previewRef} payload={payload} contractNo={createdContractId || undefined} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractCreatePage;
