import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getOrderById } from '../services/ordersApi';
import { createContract, uploadContractPdf } from '../services/contractsApi';
import { useContractCheck } from '../hooks/useContractCheck';
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
  
  // Use contract check hook to prevent duplicate creation and reload after create
  const { hasContract, getContract, reload: reloadContractMap } = useContractCheck();
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Load order from URL param
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      loadOrderById(orderId);
      // Change URL to /admin without reloading
      window.history.replaceState(null, '', '/admin');
      
      // Check if contract already exists for this order
      if (hasContract(orderId)) {
        const existingContract = getContract(orderId);
        setIsDuplicate(true);
        showToast('error', `⚠️ Đơn hàng #${orderId} đã có hợp đồng #${existingContract?.id}. Mỗi đơn hàng chỉ được tạo 1 hợp đồng!`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only re-run when orderId in URL changes

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
      newErrors.discount = 'Chiết khấu không hợp lệ';
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
      
      // Bước 1: Tạo hợp đồng trong database
      console.log('📝 Creating contract with orderId:', payload.orderId);
      const contract = await createContract(payload);
      setCreatedContractId(contract.id);
      console.log('✅ Contract created:', contract);
      console.log('📋 Contract details - ID:', contract.id, 'OrderID:', contract.orderId);
      
      // CRITICAL: Verify orderId is saved in contract
      if (!contract.orderId) {
        console.error('⚠️ WARNING: Contract created without orderId! This will cause mapping issues.');
      } else if (contract.orderId !== payload.orderId) {
        console.error('⚠️ WARNING: Contract orderId mismatch!', {
          sent: payload.orderId,
          received: contract.orderId
        });
      } else {
        console.log('✅ OrderId correctly saved:', contract.orderId);
      }
      
      // Bước 2: Generate PDF từ preview
      console.log('📄 Generating optimized PDF from preview...');
      const pdfBlob = await generatePdfFromPreview();
      const fileSizeKB = (pdfBlob.size / 1024).toFixed(2);
      const fileSizeMB = (pdfBlob.size / 1024 / 1024).toFixed(2);
      console.log('✅ PDF generated, size:', fileSizeKB, 'KB (', fileSizeMB, 'MB)');
      
      // Check file size (warn if > 5MB)
      if (pdfBlob.size > 5 * 1024 * 1024) {
        console.warn('⚠️ PDF size is large (> 5MB). Upload may fail if server limit is exceeded.');
      }
      
      // Bước 3: Upload PDF lên server
      console.log('☁️ Uploading PDF to server...');
      await uploadContractPdf(contract.id, pdfBlob);
      console.log('✅ PDF uploaded to server successfully!');
      
      // Bước 4: Reload contract map để cập nhật cache
      console.log('🔄 Reloading contract map...');
      await reloadContractMap();
      console.log('✅ Contract map refreshed!');
      
      showToast('success', `✅ Đã tạo hợp đồng ${contract.id} thành công! Đang quay về trang quản lý...`);
      
      // Auto navigate về trang quản lý đặt xe sau 1 giây
      console.log('🏠 Navigating back to order management page...');
      setTimeout(() => {
        navigate('/admin', { 
          state: { 
            tab: 'bookings',
            refresh: Date.now() // Timestamp để trigger refresh AdminPage
          } 
        });
      }, 1000); // Giảm từ 1500ms xuống 1000ms
    } catch (error: any) {
      console.error('❌ Error:', error);
      
      // Friendly error messages
      let errorMessage = 'Không thể tạo hợp đồng';
      if (error.message?.includes('Maximum upload size exceeded') || error.message?.includes('Upload failed: 400')) {
        errorMessage = 'File PDF quá lớn. Vui lòng liên hệ admin để tăng giới hạn upload.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate PDF from preview component with optimized size
   */
  const generatePdfFromPreview = async (): Promise<Blob> => {
    if (!previewRef.current) {
      throw new Error('Không tìm thấy preview element');
    }

    const element = previewRef.current;
    
    console.log('🖼️ Rendering HTML to canvas...');
    // Render HTML to canvas with REDUCED scale for smaller file size
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced from 2 to 1.5 for smaller file size (still good quality)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    console.log('📐 Canvas size:', canvas.width, 'x', canvas.height);

    // Convert canvas to PDF with JPEG compression (smaller than PNG)
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG at 85% quality (much smaller than PNG)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true, // Enable PDF compression
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST'); // Use FAST compression
    heightLeft -= pageHeight;

    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');
    console.log('✅ PDF generated with optimized size:', (pdfBlob.size / 1024).toFixed(2), 'KB');
    
    return pdfBlob;
  };

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type: type === 'warning' ? 'error' : type, message });
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
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 1;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        pageCount++;
      }

      pdf.save(`hop-dong-${createdContractId || payload.orderId || 'draft'}.pdf`);
      showToast('success', `Đã tải PDF thành công (${pageCount} trang)!`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showToast('error', 'Không thể xuất PDF. Vui lòng thử lại.');
    }
  };

  const isFormValid = selectedOrder && payload.buyer.name && payload.vehicle.model && payload.pricing.subtotal > 0;

  return (
    <>
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
        ) : isDuplicate ? (
          // Duplicate contract detected - show warning
          <div className={styles.noOrderState}>
            <div className={styles.emptyBox} style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '3rem' }}></i>
              <h2 style={{ color: '#92400e' }}>⚠️ Hợp đồng đã tồn tại</h2>
              <p style={{ color: '#78350f' }}>
                Đơn hàng <strong>#{selectedOrder.code}</strong> đã có hợp đồng <strong>#{getContract(selectedOrder.id)?.id}</strong>.
                <br />
                Mỗi đơn hàng chỉ được tạo 1 hợp đồng duy nhất!
              </p>
              <button
                className={styles.btnPrimary}
                onClick={() => navigate('/admin', { state: { tab: 'bookings' } })}
              >
                <i className="fas fa-arrow-left"></i>
                Quay lại danh sách đơn hàng
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
                {!createdContractId ? (
                  <button
                    className={styles.btnPrimary}
                    onClick={handleCreateContract}
                    disabled={!isFormValid || loading || isDuplicate}
                    title={isDuplicate ? '⚠️ Đơn hàng này đã có hợp đồng. Không thể tạo thêm!' : ''}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-contract"></i>
                        Tạo hợp đồng
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className={styles.btnSecondary}
                    onClick={() => setCreatedContractId(null)}
                  >
                    <i className="fas fa-redo"></i>
                    Tạo hợp đồng mới
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden PdfPreview for PDF generation (always rendered) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PdfPreview ref={previewRef} payload={payload} contractNo={createdContractId || undefined} />
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
              <PdfPreview payload={payload} contractNo={createdContractId || undefined} />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ContractCreatePage;
