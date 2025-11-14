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
  
  const { hasContract, getContract, reload: reloadContractMap } = useContractCheck();
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      loadOrderById(orderId);
      window.history.replaceState(null, '', '/admin');
      
      if (hasContract(orderId)) {
        const existingContract = getContract(orderId);
        setIsDuplicate(true);
        showToast('error', `⚠️ Đơn hàng #${orderId} đã có hợp đồng #${existingContract?.id}. Mỗi đơn hàng chỉ được tạo 1 hợp đồng!`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadOrderById = async (id: string) => {
    try {
      const order = await getOrderById(id);
      handleOrderSelect(order);
    } catch (error: any) {
      showToast('error', error.message || 'Không thể tải đơn hàng');
    }
  };

  const handleOrderSelect = async (order: OrderLite) => {
    setSelectedOrder(order);
    
    let dealerInfo = {
      id: order.dealer.id,
      name: order.dealer.name,
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      representative: '',
    };
    
    if (order.dealer.id) {
      try {
        const { getDealerById } = await import('../services/dealerApi');
        const dealer = await getDealerById(Number(order.dealer.id));
        if (dealer) {
          dealerInfo = {
            id: order.dealer.id,
            name: dealer.dealerName || order.dealer.name,
            phone: dealer.phone || dealer.contactPhone || '',
            email: dealer.email || dealer.dealerEmail || '',
            address: dealer.fullAddress || '',
            taxCode: '', // Dealer type doesn't have taxCode
            representative: dealer.contactPerson || '',
          };
        }
      } catch (error) {
        console.warn('Could not fetch dealer details:', error);
      }
    }
    
    setPayload({
      orderId: order.id,
      order: order,
      buyer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: order.customer.address,
      },
      dealer: dealerInfo,
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
      
      console.log('📝 Creating contract with orderId:', payload.orderId);
      const contract = await createContract(payload);
      setCreatedContractId(contract.id);
      console.log('✅ Contract created:', contract);
      
      if (!contract.orderId) {
        console.error('⚠️ WARNING: Contract created without orderId!');
      } else if (contract.orderId !== payload.orderId) {
        console.error('⚠️ WARNING: Contract orderId mismatch!', {
          sent: payload.orderId,
          received: contract.orderId
        });
      }
      
      console.log('📄 Generating optimized PDF...');
      const pdfBlob = await generatePdfFromPreview();
      const fileSizeKB = (pdfBlob.size / 1024).toFixed(2);
      console.log('✅ PDF generated, size:', fileSizeKB, 'KB');
      
      if (pdfBlob.size > 5 * 1024 * 1024) {
        console.warn('⚠️ PDF size is large (> 5MB)');
      }
      
      console.log('☁️ Uploading PDF to server...');
      await uploadContractPdf(contract.id, pdfBlob);
      console.log('✅ PDF uploaded successfully!');
      
      console.log('🔄 Reloading contract map...');
      await reloadContractMap();
      console.log('✅ Contract map refreshed!');
      
      showToast('success', `✅ Đã tạo hợp đồng ${contract.id} thành công! Đang quay về trang quản lý...`);
      
      setTimeout(() => {
        navigate('/admin', { 
          state: { 
            tab: 'bookings',
            refresh: Date.now()
          } 
        });
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error:', error);
      
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
   * Generate PDF with intelligent page breaks
   * Handles tables by splitting at row boundaries
   */
  const generatePdfFromPreview = async (): Promise<Blob> => {
    if (!previewRef.current) {
      throw new Error('Không tìm thấy preview element');
    }

    const element = previewRef.current;
    
    console.log('🖼️ Starting intelligent PDF generation...');
    
    const allElements = element.querySelectorAll<HTMLElement>('[class*="contractHeader"], [class*="article"], [class*="signatures"]');
    
    const sections = Array.from(allElements).filter(el => {
      const className = el.className;
      const isHeader = className.includes('contractHeader') && !className.includes('leftColumn') && !className.includes('rightColumn');
      const isArticle = className.includes('article') && el.tagName === 'DIV';
      const isSignatures = className.includes('signatures') && el.tagName === 'DIV';
      return isHeader || isArticle || isSignatures;
    });
    
    if (sections.length === 0) {
      console.warn('⚠️ No sections found, using fallback');
      return await generatePdfFallback(element);
    }

    console.log('📚 Found', sections.length, 'sections');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginTop = 25; // Standard document top margin (2.5cm)
    const marginBottom = 20; // Standard document bottom margin (2cm)
    const marginLeft = 20; // Standard document side margin (2cm)
    const usableHeight = pageHeight - marginTop - marginBottom;
    const contentWidth = pageWidth - (marginLeft * 2);
    
    let currentY = marginTop;
    let pageNumber = 1;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionClass = section.className.split('_')[1]?.split(' ')[0] || `section-${i}`;
      
      console.log(`\n📦 Processing ${sectionClass} (${i + 1}/${sections.length})...`);

      const table = section.querySelector('table');
      if (table) {
        console.log('   🔍 Section contains table, using row-by-row rendering');
        const result = await renderTableSection(
          pdf, section, table, contentWidth, marginLeft, 
          pageWidth, pageHeight, marginTop, marginBottom, currentY, pageNumber
        );
        currentY = result.currentY;
        pageNumber = result.pageNumber;
        continue;
      }

      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: section.scrollWidth,
        windowHeight: section.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log(`   📐 Section size: ${imgHeight.toFixed(2)} mm`);

      const spaceLeft = pageHeight - currentY - marginBottom;
      
      if (imgHeight > spaceLeft && currentY > marginTop + 10) {
        console.log(`   ⏭️  Moving to new page`);
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
      }

      if (imgHeight > usableHeight) {
        console.log(`   ⚠️  Section too tall, splitting...`);
        const result = await splitAndAddImage(
          pdf, canvas, imgData, imgWidth, imgHeight, marginLeft, 
          currentY, pageHeight, marginTop, marginBottom, pageNumber
        );
        currentY = result.currentY;
        pageNumber = result.pageNumber;
      } else {
        pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'FAST');
        console.log(`   ✅ Added at Y=${currentY.toFixed(2)}mm`);
        currentY += imgHeight + 3;
      }
    }

    const pdfBlob = pdf.output('blob');
    console.log(`\n✅ PDF generated - ${pdf.internal.pages.length - 1} pages`);
    
    return pdfBlob;
  };

  /**
   * Render table by breaking at row boundaries
   */
  const renderTableSection = async (
    pdf: jsPDF,
    section: HTMLElement,
    table: HTMLTableElement,
    contentWidth: number,
    marginLeft: number,
    _pageWidth: number,
    pageHeight: number,
    marginTop: number,
    marginBottom: number,
    startY: number,
    startPage: number
  ): Promise<{ currentY: number; pageNumber: number }> => {
    console.log('   📊 Rendering table with smart row breaks...');
    
    const parts: HTMLElement[] = [];
    
    const childrenBeforeTable = Array.from(section.children).filter(child => 
      child !== table && section.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING
    ) as HTMLElement[];
    parts.push(...childrenBeforeTable);
    
    const thead = table.querySelector('thead');
    if (thead) parts.push(thead as HTMLElement);
    
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('tr')) as HTMLElement[];
      parts.push(...rows);
    }
    
    const childrenAfterTable = Array.from(section.children).filter(child => 
      child !== table && section.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_PRECEDING
    ) as HTMLElement[];
    parts.push(...childrenAfterTable);
    
    console.log(`   📋 Split into ${parts.length} parts`);
    
    let currentY = startY;
    let pageNumber = startPage;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      const canvas = await html2canvas(part, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: part.scrollWidth,
        windowHeight: part.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const spaceLeft = pageHeight - currentY - marginBottom;
      
      if (imgHeight > spaceLeft && currentY > marginTop + 10) {
        console.log(`   ⏭️  Row ${i} needs new page`);
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
        
        if (i > 1 && thead) {
          const headerCanvas = await html2canvas(thead as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: thead.scrollWidth,
            windowHeight: thead.scrollHeight,
          });
          const headerData = headerCanvas.toDataURL('image/png');
          const headerHeight = (headerCanvas.height * imgWidth) / headerCanvas.width;
          pdf.addImage(headerData, 'PNG', marginLeft, currentY, imgWidth, headerHeight, undefined, 'FAST');
          currentY += headerHeight + 1;
        }
      }
      
      pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'FAST');
      currentY += imgHeight + 0.5;
    }
    
    return { currentY, pageNumber };
  };

  /**
   * Split large image across pages
   */
  const splitAndAddImage = async (
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    _imgData: string,
    imgWidth: number,
    imgHeight: number,
    marginLeft: number,
    startY: number,
    pageHeight: number,
    marginTop: number,
    marginBottom: number,
    startPage: number
  ): Promise<{ currentY: number; pageNumber: number }> => {
    let remainingHeight = imgHeight;
    let sourceY = 0;
    let currentY = startY;
    let pageNumber = startPage;

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - currentY - marginBottom;
      const heightToAdd = Math.min(remainingHeight, availableHeight);
      const sourceHeightPx = (heightToAdd / imgWidth) * canvas.width;
      
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeightPx;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeightPx, 0, 0, canvas.width, sourceHeightPx);
        const croppedData = tempCanvas.toDataURL('image/png');
        pdf.addImage(croppedData, 'PNG', marginLeft, currentY, imgWidth, heightToAdd, undefined, 'FAST');
      }
      
      sourceY += sourceHeightPx;
      remainingHeight -= heightToAdd;

      if (remainingHeight > 5) {
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
      }
    }
    
    return { currentY, pageNumber };
  };

  /**
   * Fallback: render entire document as one image
   */
  const generatePdfFallback = async (element: HTMLElement): Promise<Blob> => {
    console.log('📄 Using fallback rendering...');
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  };

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type: type === 'warning' ? 'error' : type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleExportPdf = async () => {
    if (!previewRef.current) return;

    try {
      const element = previewRef.current;
      
      console.log('📥 Exporting PDF for download...');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 1;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
        pageCount++;
      }

      const filename = `hop-dong-${createdContractId || payload.orderId || 'draft'}.pdf`;
      pdf.save(filename);
      console.log('✅ PDF exported:', filename, '- Pages:', pageCount);
      showToast('success', `✅ Đã tải PDF thành công (${pageCount} trang)!`);
    } catch (error) {
      console.error('❌ Failed to export PDF:', error);
      showToast('error', 'Không thể xuất PDF. Vui lòng thử lại.');
    }
  };

  const isFormValid = selectedOrder && payload.buyer.name && payload.vehicle.model && payload.pricing.subtotal > 0;

  return (
    <>
      <div className={styles.page}>
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

        {!selectedOrder ? (
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
          <div className={styles.fullWidthLayout}>
            <div className={styles.formContainer}>
              <ContractForm
                payload={payload}
                onChange={handlePayloadChange}
                errors={errors}
                orderData={selectedOrder}
              />
            </div>

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

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <PdfPreview ref={previewRef} payload={payload} contractNo={createdContractId || undefined} />
      </div>

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