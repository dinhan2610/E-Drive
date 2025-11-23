import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getContract, saveManufacturerSignature, saveDealerSignature, uploadContractPdf } from '../services/contractsApi';
import { getOrderById } from '../services/ordersApi';
import type { Contract } from '../types/contract';
import type { ContractPayload } from '../types/contract';
import type { OrderLite } from '../types/order';
import PdfPreviewWithSignature from '../components/contracts/PdfPreviewWithSignature';
import styles from './ContractSignPage.module.scss';

const ContractSignPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [payload, setPayload] = useState<ContractPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [signerType, setSignerType] = useState<'manufacturer' | 'dealer'>('manufacturer');

  // Helper to get return path based on user role
  const getReturnPath = () => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    return userRole?.includes('dealer') ? '/delivery-status' : '/admin';
  };

  useEffect(() => {
    if (contractId) {
      loadContract(contractId);
    }
  }, [contractId]);

  // Debug: Log when signerType changes
  useEffect(() => {
  }, [signerType]);

  const loadContract = async (id: string) => {
    try {
      setLoading(true);
      
      const contractData = await getContract(id);
      
      // Check both nested and flat structure for manufacturer signature
      const mfrSigNested = contractData.manufacturer?.signatureData;
      const mfrSigFlat = contractData.manufacturerSignatureData;
      const hasMfrSignature = !!(mfrSigNested || mfrSigFlat);
      
      setContract(contractData);
      
      // Determine signer type based on contract status and user role
      const user = getCurrentUser();
      const userRole = user?.role?.toLowerCase(); // Normalize to lowercase
      
      // Check if user is dealer (includes dealer, dealer_manager, etc.)
      let isDealer = userRole?.includes('dealer') || false;
      
      
      // Logic: Dealer ký khi status = SIGNING
      // Admin/Manufacturer ký khi status = DRAFT hoặc SIGNING (nếu chưa có chữ ký hãng)
      if (isDealer) {
        // Dealer luôn vào dealer mode
        if (contractData.status !== 'SIGNING') {
          console.warn('⚠️ Contract status is not SIGNING. Dealer should only sign when status = SIGNING');
          alert('Hợp đồng chưa sẵn sàng để đại lý ký. Vui lòng đợi hãng sản xuất ký trước.');
          navigate(getReturnPath());
          return;
        }
        if (!hasMfrSignature) {
          console.warn('⚠️ Manufacturer signature not found. Dealer cannot sign yet.');
          alert('Chưa có chữ ký của hãng sản xuất. Vui lòng đợi hãng ký trước.');
          navigate(getReturnPath());
          return;
        }
        setSignerType('dealer');
      } else {
        // Admin/Manufacturer mode
        setSignerType('manufacturer');
      }
      
      // Load order data if orderId exists
      let loadedOrder: OrderLite | null = null;
      if (contractData.orderId) {
        try {
          loadedOrder = await getOrderById(contractData.orderId);
          
          // Merge order data into contract for display
          contractData.order = loadedOrder;
          setContract({...contractData});
        } catch (orderError) {
          console.warn('⚠️ Could not load order data:', orderError);
        }
      }
      
      // Load dealer details to get representative/contactPerson
      let dealerRepresentative = contractData.dealer?.representative || '';
      if (!dealerRepresentative && (contractData.dealer?.id || loadedOrder?.dealer?.id)) {
        try {
          const dealerId = contractData.dealer?.id || loadedOrder?.dealer?.id;
          const { getDealerById } = await import('../services/dealerApi');
          const dealerDetails = await getDealerById(Number(dealerId));
          if (dealerDetails) {
            dealerRepresentative = dealerDetails.contactPerson || '';
          }
        } catch (dealerError) {
          console.warn('⚠️ Could not load dealer details:', dealerError);
        }
      }
      
      // Convert Contract to ContractPayload for PdfPreview component
      
      const convertedPayload: ContractPayload = {
        orderId: contractData.orderId || '',
        buyer: contractData.buyer || { name: '' },
        dealer: {
          id: contractData.dealer?.id || '',
          name: contractData.dealer?.name || loadedOrder?.dealer?.name || '',
          phone: contractData.dealer?.phone || '',
          email: contractData.dealer?.email || '',
          address: contractData.dealer?.address || '',
          taxCode: contractData.dealer?.taxCode || '',
          representative: dealerRepresentative,
        },
        manufacturer: contractData.manufacturer || {
          name: 'E-DRIVE VIETNAM',
          address: '123 Đường Xe Điện, Quận 1, TP.HCM',
          phone: '(0123) 456 789',
          email: 'contact@e-drive.vn',
          taxCode: '0123456789',
        },
        vehicle: contractData.vehicle || { model: '' },
        terms: contractData.terms || {},
        pricing: contractData.pricing || {
          subtotal: 0,
          discount: 0,
          taxPercent: 10,
          fees: 0,
          total: 0,
          paidTotal: 0,
          remaining: 0,
        },
        order: loadedOrder || undefined,
      };
      
      
      setPayload(convertedPayload);
    } catch (error: any) {
      console.error('❌ Error loading contract:', error);
      alert('Không thể tải hợp đồng. Vui lòng thử lại.');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const canvas = canvasRef.current;
      setSignatureData(canvas.toDataURL());
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureData('');
  };

  const generateSignedPdf = async (): Promise<Blob> => {
    const element = documentRef.current;
    if (!element) {
      throw new Error('Không tìm thấy nội dung hợp đồng');
    }


    // CRITICAL: Use higher scale for sharper text
    const scale = 3; // Increase from 2 to 3 for better quality
    
    // Find all main sections
    const allElements = element.querySelectorAll<HTMLElement>('[class*="contractHeader"], [class*="article"], [class*="signatures"]');
    
    const sections = Array.from(allElements).filter(el => {
      const className = el.className;
      const isHeader = className.includes('contractHeader') && !className.includes('leftColumn') && !className.includes('rightColumn');
      const isArticle = className.includes('article') && el.tagName === 'DIV';
      const isSignatures = className.includes('signatures') && el.tagName === 'DIV';
      return isHeader || isArticle || isSignatures;
    });

    if (sections.length === 0) {
      console.warn('⚠️ No sections found, using simple generation');
      return await generatePdfSimple(element);
    }


    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false, // Don't compress to preserve quality
      putOnlyUsedFonts: true,
      floatPrecision: 16,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginTop = 25;
    const marginBottom = 20;
    const marginLeft = 20;
    const marginRight = 20;
    const usableHeight = pageHeight - marginTop - marginBottom;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    let currentY = marginTop;
    let pageNumber = 1;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionClass = section.className || `section-${i}`;
      

      // Check if section contains a table
      const table = section.querySelector('table');
      const isSignatureSection = sectionClass.includes('signatures');

      // ⭐ HANDLE TABLE SECTION - Render row-by-row
      if (table && !isSignatureSection) {
        const result = await renderTableSectionRowByRow(
          pdf, section, table as HTMLTableElement, contentWidth, marginLeft,
          pageWidth, pageHeight, marginTop, marginBottom, currentY, pageNumber, scale
        );
        currentY = result.currentY;
        pageNumber = result.pageNumber;
        continue; // Skip normal rendering
      }

      // ⭐ SIGNATURE SECTION - Always keep on one page
      if (isSignatureSection) {
        const canvas = await html2canvas(section, {
          scale: scale,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const spaceLeft = pageHeight - currentY - marginBottom;
        
        // If signature doesn't fit, move to new page (don't split)
        if (imgHeight > spaceLeft) {
          pdf.addPage();
          pageNumber++;
          currentY = marginTop;
        }
        
        pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
        currentY += imgHeight + 3;
        continue;
      }

      // ⭐ REGULAR SECTION (no table, no signature)
      const canvas = await html2canvas(section, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      

      const spaceLeft = pageHeight - currentY - marginBottom;
      
      // Check if need new page
      if (imgHeight > spaceLeft && currentY > marginTop + 10) {
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
      }

      // If section still too tall, split it
      if (imgHeight > usableHeight) {
        const result = await splitImageAcrossPages(
          pdf, canvas, imgWidth, imgHeight, marginLeft,
          currentY, pageHeight, marginTop, marginBottom, pageNumber
        );
        currentY = result.currentY;
        pageNumber = result.pageNumber;
      } else {
        pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
        currentY += imgHeight + 5;
      }
    }

    const pdfBlob = pdf.output('blob');
    const totalPages = pdf.internal.pages.length - 1;
    const sizeKB = (pdfBlob.size / 1024).toFixed(2);
    
    
    return pdfBlob;
  };

  /**
   * Render table section row-by-row (prevents text cut-off)
   */
  const renderTableSectionRowByRow = async (
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
    startPage: number,
    scale: number
  ): Promise<{ currentY: number; pageNumber: number }> => {
    
    const parts: HTMLElement[] = [];
    
    // Elements before table
    const childrenBeforeTable = Array.from(section.children).filter(child => 
      child !== table && section.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING
    ) as HTMLElement[];
    parts.push(...childrenBeforeTable);
    
    // Table header
    const thead = table.querySelector('thead');
    if (thead) parts.push(thead as HTMLElement);
    
    // Table rows (each row separately!)
    const tbody = table.querySelector('tbody');
    if (tbody) {
      const rows = Array.from(tbody.querySelectorAll('tr')) as HTMLElement[];
      parts.push(...rows);
    }
    
    // Elements after table
    const childrenAfterTable = Array.from(section.children).filter(child => 
      child !== table && section.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_PRECEDING
    ) as HTMLElement[];
    parts.push(...childrenAfterTable);
    
    
    let currentY = startY;
    let pageNumber = startPage;
    let lastWasHeader = false;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isHeader = part.tagName === 'THEAD';
      const isRow = part.tagName === 'TR';
      
      // Render this part
      const canvas = await html2canvas(part, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const spaceLeft = pageHeight - currentY - marginBottom;
      
      // Check if need new page
      if (imgHeight > spaceLeft && currentY > marginTop + 10) {
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
        
        // Re-render header on new page (if not already header and we have one)
        if (!isHeader && i > 0 && thead) {
          const headerCanvas = await html2canvas(thead as HTMLElement, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const headerData = headerCanvas.toDataURL('image/png', 1.0);
          const headerHeight = (headerCanvas.height * imgWidth) / headerCanvas.width;
          pdf.addImage(headerData, 'PNG', marginLeft, currentY, imgWidth, headerHeight, undefined, 'MEDIUM');
          currentY += headerHeight + 0.5;
        }
      }
      
      // Add the part
      pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
      
      if (isHeader) {
        lastWasHeader = true;
      } else if (isRow) {
      }
      
      currentY += imgHeight + 0.5; // Small spacing between rows
    }
    
    currentY += 3; // Spacing after table
    return { currentY, pageNumber };
  };

  /**
   * Split large image across pages
   */
  const splitImageAcrossPages = async (
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    imgWidth: number,
    imgHeight: number,
    marginLeft: number,
    startY: number,
    pageHeight: number,
    marginTop: number,
    marginBottom: number,
    startPage: number
  ): Promise<{ currentY: number; pageNumber: number }> => {
    let heightLeft = imgHeight;
    let sourceY = 0;
    let currentY = startY;
    let pageNumber = startPage;
    
    while (heightLeft > 0) {
      const availableHeight = pageHeight - currentY - marginBottom;
      const partHeight = Math.min(availableHeight, heightLeft);
      
      // Calculate source rectangle in canvas pixels
      const sourceYPx = (sourceY * canvas.width) / imgWidth;
      const partHeightPx = (partHeight * canvas.width) / imgWidth;
      
      // Create temporary canvas for this part
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = partHeightPx;
      
      const tempCtx = tempCanvas.getContext('2d', { alpha: false });
      if (tempCtx) {
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.drawImage(
          canvas,
          0, sourceYPx,
          canvas.width, partHeightPx,
          0, 0,
          canvas.width, partHeightPx
        );
        
        const partImgData = tempCanvas.toDataURL('image/png', 1.0);
        pdf.addImage(partImgData, 'PNG', marginLeft, currentY, imgWidth, partHeight, undefined, 'MEDIUM');
      }
      
      heightLeft -= partHeight;
      sourceY += partHeight;
      
      if (heightLeft > 0) {
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
      } else {
        currentY += partHeight + 5;
      }
    }
    
    return { currentY, pageNumber };
  };

  // Fallback: Simple single-image PDF generation
  const generatePdfSimple = async (element: HTMLElement): Promise<Blob> => {
    
    const canvas = await html2canvas(element, {
      scale: 3, // High quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const imgData = canvas.toDataURL('image/png', 1.0);

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  };

  const handleSubmit = async () => {
    if (!hasSignature || !signatureData) {
      alert('Vui lòng ký tên trước khi xác nhận!');
      return;
    }

    if (!contractId) {
      alert('Không tìm thấy mã hợp đồng!');
      return;
    }

    try {
      setSubmitting(true);
      
      if (signerType === 'manufacturer') {
        await saveManufacturerSignature(contractId, signatureData);
      } else {
        await saveDealerSignature(contractId, signatureData);
      }
      
      // Step 2: Generate PDF with signature
      const pdfBlob = await generateSignedPdf();
      
      // Step 3: Upload PDF to server
      await uploadContractPdf(Number(contractId), pdfBlob);
      
      const successMessage = signerType === 'manufacturer' 
        ? '✅ Hãng sản xuất đã ký hợp đồng thành công! Chờ đại lý ký.'
        : '✅ Đại lý đã ký hợp đồng thành công! Hợp đồng đã hoàn tất.';
      
      alert(successMessage);
      
      const returnPath = signerType === 'manufacturer' ? '/admin' : '/delivery-status';
      navigate(returnPath, { state: { tab: 'bookings' } });
    } catch (error: any) {
      console.error('❌ Error signing contract:', error);
      alert(error.message || 'Không thể lưu chữ ký. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (!contract || !payload) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>Không tìm thấy hợp đồng</p>
          <button onClick={() => navigate(getReturnPath())}>Quay lại</button>
        </div>
      </div>
    );
  }

  const manufacturerSignature = contract.manufacturer?.signatureData || contract.manufacturerSignatureData;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button onClick={() => navigate(getReturnPath())} className={styles.backButton}>
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        <h1>
          <i className="fas fa-signature"></i>
          Ký hợp đồng điện tử
        </h1>
      </div>

      <div className={styles.contractWrapper}>
        <PdfPreviewWithSignature
          ref={documentRef}
          payload={payload}
          contractNo={contract.id}
          signerType={signerType}
          manufacturerSignature={manufacturerSignature}
          canvasRef={canvasRef}
          hasSignature={hasSignature}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Action buttons */}
        <div className={styles.actionBar}>
          <button onClick={clearSignature} className={styles.clearButton} disabled={!hasSignature || submitting}>
            <i className="fas fa-eraser"></i>
            Xóa chữ ký
          </button>
          <button 
            onClick={handleSubmit} 
            className={styles.submitButton}
            disabled={!hasSignature || submitting}
          >
            <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-check"}></i>
            {submitting ? 'Đang xử lý và tạo PDF...' : 'Xác nhận ký hợp đồng'}
          </button>
        </div>
      </div>

      {/* Loading overlay when generating PDF */}
      {submitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingBox}>
            <i className="fas fa-file-pdf fa-3x"></i>
            <h3>Đang xử lý hợp đồng...</h3>
            <div className={styles.progressSteps}>
              <p>✅ Lưu chữ ký vào cơ sở dữ liệu</p>
              <p>📄 Tạo file PDF có chữ ký</p>
              <p>☁️ Upload PDF lên server</p>
            </div>
            <p className={styles.loadingNote}>Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSignPage;
