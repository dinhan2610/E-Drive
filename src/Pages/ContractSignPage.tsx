import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getContract, saveManufacturerSignature, saveDealerSignature, uploadContractPdf } from '../services/contractsApi';
import { getOrderById } from '../services/ordersApi';
import type { Contract } from '../types/contract';
import type { OrderLite } from '../types/order';
import styles from './ContractSignPage.module.scss';

const ContractSignPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [orderData, setOrderData] = useState<OrderLite | null>(null);
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
    console.log('🔄 SignerType changed to:', signerType);
  }, [signerType]);

  const loadContract = async (id: string) => {
    try {
      setLoading(true);
      console.log('📄 Loading contract:', id);
      
      const contractData = await getContract(id);
      console.log('📄 Contract data:', contractData);
      console.log('📄 Full contract object:', JSON.stringify(contractData, null, 2));
      
      // Check both nested and flat structure for manufacturer signature
      const mfrSigNested = contractData.manufacturer?.signatureData;
      const mfrSigFlat = contractData.manufacturerSignatureData;
      const hasMfrSignature = !!(mfrSigNested || mfrSigFlat);
      
      console.log('🔍 Manufacturer object:', contractData.manufacturer);
      console.log('🔍 Manufacturer signature (nested):', mfrSigNested ? 'EXISTS' : 'MISSING');
      console.log('🔍 Manufacturer signature (flat):', mfrSigFlat ? 'EXISTS' : 'MISSING');
      console.log('🔍 Has manufacturer signature:', hasMfrSignature);
      console.log('🔍 Dealer signature:', contractData.dealer?.signatureData || contractData.dealerSignatureData ? 'EXISTS' : 'MISSING');
      setContract(contractData);
      
      // Determine signer type based on contract status and user role
      const userRole = localStorage.getItem('userRole')?.toLowerCase(); // Normalize to lowercase
      const userData = localStorage.getItem('e-drive-user');
      
      // Check if user is dealer (includes dealer, dealer_manager, etc.)
      let isDealer = userRole?.includes('dealer') || false;
      
      // Fallback: check from userData if userRole is not set
      if (!userRole && userData) {
        try {
          const parsed = JSON.parse(userData);
          const role = parsed.role?.toLowerCase();
          isDealer = role?.includes('dealer') || false;
        } catch (e) {
          console.warn('Could not parse user data');
        }
      }
      
      console.log('👤 Current user role:', userRole);
      console.log('👤 Is dealer:', isDealer);
      console.log('📋 Contract status:', contractData.status);
      console.log('📋 Has manufacturer signature (already logged above):', hasMfrSignature);
      
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
        console.log('✅ Signer type: DEALER - Will show manufacturer signature (read-only) + dealer canvas (editable)');
      } else {
        // Admin/Manufacturer mode
        setSignerType('manufacturer');
        console.log('✅ Signer type: MANUFACTURER - Will show manufacturer canvas (editable) + dealer placeholder');
      }
      
      // Load order data if orderId exists
      if (contractData.orderId) {
        console.log('📦 Loading order:', contractData.orderId);
        try {
          const order = await getOrderById(contractData.orderId);
          console.log('📦 Order data:', order);
          setOrderData(order);
          
          // Merge order data into contract for display
          contractData.order = order;
          setContract({...contractData});
        } catch (orderError) {
          console.warn('⚠️ Could not load order data:', orderError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading contract:', error);
      alert('Không thể tải hợp đồng. Vui lòng thử lại.');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
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

    console.log('📄 Starting HIGH-QUALITY PDF generation with signatures...');

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

    console.log('📚 Found', sections.length, 'sections to render');

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
      
      console.log(`📦 Processing section ${i + 1}/${sections.length}: ${sectionClass.substring(0, 30)}...`);

      // Check if section contains a table
      const table = section.querySelector('table');
      const isSignatureSection = sectionClass.includes('signatures');

      // ⭐ HANDLE TABLE SECTION - Render row-by-row
      if (table && !isSignatureSection) {
        console.log('   🔍 Section contains TABLE - rendering row-by-row for perfect alignment');
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
        console.log('   ✍️  SIGNATURE SECTION - ensuring no split');
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
          console.log('   ⏭️  Moving ENTIRE signature section to new page');
          pdf.addPage();
          pageNumber++;
          currentY = marginTop;
        }
        
        pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
        console.log(`   ✅ Added complete signature section at Y=${currentY.toFixed(2)}mm`);
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
      
      console.log(`   📐 Section height: ${imgHeight.toFixed(2)} mm`);

      const spaceLeft = pageHeight - currentY - marginBottom;
      
      // Check if need new page
      if (imgHeight > spaceLeft && currentY > marginTop + 10) {
        console.log('   ⏭️  Moving to new page');
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
      }

      // If section still too tall, split it
      if (imgHeight > usableHeight) {
        console.log('   ⚠️  Section too tall, splitting...');
        const result = await splitImageAcrossPages(
          pdf, canvas, imgWidth, imgHeight, marginLeft,
          currentY, pageHeight, marginTop, marginBottom, pageNumber
        );
        currentY = result.currentY;
        pageNumber = result.pageNumber;
      } else {
        pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
        console.log(`   ✅ Added at Y=${currentY.toFixed(2)}mm`);
        currentY += imgHeight + 5;
      }
    }

    const pdfBlob = pdf.output('blob');
    const totalPages = pdf.internal.pages.length - 1;
    const sizeKB = (pdfBlob.size / 1024).toFixed(2);
    
    console.log(`\n✅ HIGH-QUALITY PDF generated:`);
    console.log(`   📄 Pages: ${totalPages}`);
    console.log(`   💾 Size: ${sizeKB} KB`);
    console.log(`   📐 Scale: ${scale}x (high quality)`);
    
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
    console.log('   📊 Rendering table with smart row breaks...');
    
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
      console.log(`   📋 Found ${rows.length} table rows`);
      parts.push(...rows);
    }
    
    // Elements after table
    const childrenAfterTable = Array.from(section.children).filter(child => 
      child !== table && section.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_PRECEDING
    ) as HTMLElement[];
    parts.push(...childrenAfterTable);
    
    console.log(`   📋 Split into ${parts.length} parts (header + ${tbody?.querySelectorAll('tr').length || 0} rows)`);
    
    let currentY = startY;
    let pageNumber = startPage;
    let lastWasHeader = false;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isHeader = part.tagName === 'THEAD';
      const isRow = part.tagName === 'TR';
      
      // Render this part
      const canvas = await html2canvas(row, {
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
        console.log(`   ⏭️  Part ${i} (${part.tagName}) needs new page`);
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
        
        // Re-render header on new page (if not already header and we have one)
        if (!isHeader && i > 0 && thead) {
          const headerCanvas = await html2canvas(headerClone, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const headerData = headerCanvas.toDataURL('image/png', 1.0);
          const headerHeight = (headerCanvas.height * imgWidth) / headerCanvas.width;
          pdf.addImage(headerData, 'PNG', marginLeft, currentY, imgWidth, headerHeight, undefined, 'MEDIUM');
          currentY += headerHeight + 0.5;
          console.log(`      ↪️  Re-added table header`);
        }
      }
      
      // Add the part
      pdf.addImage(imgData, 'PNG', marginLeft, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
      
      if (isHeader) {
        console.log(`      ✓ Added header at Y=${currentY.toFixed(2)}mm`);
        lastWasHeader = true;
      } else if (isRow) {
        console.log(`      ✓ Added row ${i - (lastWasHeader ? 1 : 0)} at Y=${currentY.toFixed(2)}mm`);
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
        console.log(`      ✓ Added part: ${partHeight.toFixed(2)}mm at Y=${currentY.toFixed(2)}mm`);
      }
      
      heightLeft -= partHeight;
      sourceY += partHeight;
      
      if (heightLeft > 0) {
        pdf.addPage();
        pageNumber++;
        currentY = marginTop;
        console.log(`      📄 New page ${pageNumber}`);
      } else {
        currentY += partHeight + 5;
      }
    }
    
    return { currentY, pageNumber };
  };

  // Fallback: Simple single-image PDF generation
  const generatePdfSimple = async (element: HTMLElement): Promise<Blob> => {
    console.log('📄 Using simple PDF generation...');
    
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
        console.log('💾 Step 1: Saving manufacturer signature to database...');
        await saveManufacturerSignature(contractId, signatureData);
        console.log('✅ Manufacturer signature saved to database');
      } else {
        console.log('💾 Step 1: Saving dealer signature to database...');
        await saveDealerSignature(contractId, signatureData);
        console.log('✅ Dealer signature saved to database');
      }
      
      // Step 2: Generate PDF with signature
      console.log('📄 Step 2: Generating signed PDF...');
      const pdfBlob = await generateSignedPdf();
      
      // Step 3: Upload PDF to server
      console.log('☁️ Step 3: Uploading signed PDF to server...');
      await uploadContractPdf(Number(contractId), pdfBlob);
      console.log('✅ Signed PDF uploaded successfully');
      
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

  if (!contract) {
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

  const orderCode = contract.order?.code || orderData?.code || contract.orderId || 'N/A';
  const dealerName = contract.dealer?.name || orderData?.dealer?.name || 'N/A';
  const buyerName = contract.buyer?.name || orderData?.customer?.name || 'N/A';
  const orderItems = contract.order?.orderItems || orderData?.orderItems || [];
  const orderMoney = contract.order?.money || orderData?.money || contract.pricing;
  const orderDate = contract.order?.orderDate || orderData?.orderDate || contract.createdAt;
  const deliveryDate = contract.terms?.deliveryDate || contract.order?.desiredDeliveryDate || orderData?.desiredDeliveryDate;

  console.log('📊 Display data:', {
    orderCode,
    dealerName,
    buyerName,
    orderItems: orderItems.length,
    orderMoney,
    orderDate,
    deliveryDate
  });

  console.log('🎨 Rendering with signerType:', signerType);
  console.log('🎨 Will render:', signerType === 'manufacturer' ? 'Manufacturer canvas + Dealer placeholder' : 'Manufacturer image + Dealer canvas');

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
        <div ref={documentRef} className={styles.contractDocument}>
          {/* Header */}
          <div className={styles.contractHeader}>
            <div className={styles.leftColumn}>
              <div className={styles.companyInfo}>
                <h3>CÔNG TY E-DRIVE VIỆT NAM</h3>
                <p><strong>MSDN:</strong> {contract.manufacturer?.taxCode || '0123456789'}</p>
                <p><strong>Địa chỉ:</strong> {contract.manufacturer?.address || '123 Đường Điện Biên Phủ, Quận 1, TP.HCM'}</p>
                <p><strong>Điện thoại:</strong> {contract.manufacturer?.phone || '(0123) 456 789'}</p>
                <p>Kết nối giữa các bên:</p>
              </div>
              
              <div className={styles.partyInfo}>
                <p><strong>BÊN A: MUA (Đại lý)</strong></p>
                <p><strong>Tên người đại diện:</strong> {contract.dealer?.representative || '__________'}</p>
                <p><strong>Đại diện:</strong> {dealerName}</p>
                <p><strong>Địa chỉ:</strong> {contract.dealer?.address || 'Chưa cập nhật'}</p>
                <p><strong>Số điện thoại:</strong> {contract.dealer?.phone || 'Chưa cập nhật'}</p>
                <p><strong>Chức vụ:</strong> Quản lý</p>
              </div>
              
              <div className={styles.partyInfo}>
                <p><strong>BÊN B: BÁN (Hãng sản xuất)</strong></p>
                <p><strong>Văn phòng:</strong> Tại các Trưởng Phòng Kinh Doanh Trưng Bày, Tư vấn</p>
                <p><strong>Đại diện:</strong> {contract.manufacturer?.name || 'E-DRIVE VIETNAM'}</p>
                <p><strong>Tên người đại diện:</strong> Thân Trọng An</p>
                <p><strong>Số điện thoại:</strong> 0912345678</p>
                <p><strong>Chức vụ:</strong> Giám đốc</p>
              </div>
            </div>
            
            <div className={styles.rightColumn}>
              <h1 className={styles.mainTitle}>HỢP ĐỒNG MUA BÁN XE</h1>
              <p className={styles.contractNo}>Số: <strong>#{contract.id}</strong> - BMW/VL</p>
              <p className={styles.contractDate}>Ký vào ngày {formatDate(orderDate)} tại</p>
              <p className={styles.note}>Ký với giấy các bên:</p>
            </div>
          </div>

          {/* ĐIỀU 1 */}
          <div className={styles.article}>
            <h4>ĐIỀU 1. ĐỐI TƯỢNG HỢP ĐỒNG</h4>
            <p>Căn cứ theo đơn hàng số {orderCode} do Hợp đồng này có hiệu lực từ ngày {formatDate(orderDate)} ("Hợp đồng") với các đại điểm sau:</p>
            
            <table className={styles.vehicleTable}>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mô tả hàng hóa</th>
                  <th>SL</th>
                  <th>Đơn giá<br/>(đã gồm VAT)</th>
                  <th>Thành tiền<br/>(đã gồm VAT)</th>
                </tr>
              </thead>
              <tbody>
                {orderItems && orderItems.length > 0 ? (
                  <>
                    {orderItems.map((item, index) => {
                      const vehicleParts = item.vehicleName.split(' ');
                      const vehicleModel = vehicleParts.slice(0, 2).join(' ');
                      const vehicleVersion = vehicleParts.slice(2).join(' ') || 'Standard';
                      
                      const taxPercent = orderMoney?.taxPercent || 10;
                      const priceAfterDiscount = item.itemSubtotal - item.itemDiscount;
                      const unitPriceWithVAT = (item.unitPrice - (item.itemDiscount / item.quantity)) * (1 + taxPercent / 100);
                      const totalWithVAT = priceAfterDiscount * (1 + taxPercent / 100);
                      
                      return (
                        <tr key={index}>
                          <td>{(index + 1).toString().padStart(2, '0')}</td>
                          <td>
                            <div className={styles.vehicleDesc}>
                              <p><strong>XE Ô TÔ ĐIỆN {vehicleModel.toUpperCase()}</strong></p>
                              <p>- Phiên bản: {vehicleVersion}</p>
                              <p>- Số chỗ ngồi: 05 chỗ</p>
                              <p>- Nguồn gốc xuất xứ: Xe được nhập khẩu nguyên chiếc.</p>
                              <p>- Màu sơn: {item.color || 'Chưa xác định'}</p>
                              <p>- Năm sản xuất: {new Date().getFullYear()}</p>
                              <p>- Màu nội thất: Đen</p>
                              <p>- Chế động và quy cách: Một 100%; tay lái thuận tay với các thiết bị kỹ thuật theo quy chuẩn và có nhãn hàng xuất sản xuất.</p>
                            </div>
                          </td>
                          <td className={styles.centerText}>{item.quantity.toString().padStart(2, '0')}</td>
                          <td className={styles.rightText}>{formatCurrency(unitPriceWithVAT)}</td>
                          <td className={styles.rightText}>{formatCurrency(totalWithVAT)}</td>
                        </tr>
                      );
                    })}
                    <tr className={styles.totalRow}>
                      <td colSpan={2}><strong>Tổng Giá trị Hợp đồng</strong></td>
                      <td className={styles.centerText}>
                        <strong>
                          {orderItems.reduce((sum, item) => sum + item.quantity, 0).toString().padStart(2, '0')}
                        </strong>
                      </td>
                      <td className={styles.rightText}><strong></strong></td>
                      <td className={styles.rightText}><strong>{formatCurrency(orderMoney?.total || contract.pricing?.total || 0)}</strong></td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5}>Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ĐIỀU 2 */}
          <div className={styles.article}>
            <h4>ĐIỀU 2. ĐẶT CỌC VÀ THANH TOÁN</h4>
            <ul>
              <li>Thời hạn giao xe: Trong tháng {formatDate(deliveryDate)}.</li>
              <li>Địa điểm giao xe: Tại cơ sở từ việc kho của Bên Bán theo cơ sở tại Hợp đồng của bên giao nơi từ nay đặt xe giao không nhân được bên khác (Bên) bao, có ghi rõ lý do và phải lấy trả bằng giấy.</li>
            </ul>
          </div>

          {/* ĐIỀU 3 */}
          <div className={styles.article}>
            <h4>ĐIỀU 3. THÔNG TIN GIAO NHẬN VÀ CHẤT LƯỢNG SẢN PHẨM</h4>
            <p>Bên Mua phải giao xe: Xe được bàn giao phải là xe mới 100%, theo đúng chuẩn loại trong Mã Hợp đồng bao. Thống báo sẵn sàng giao xe; Bên trong sau khi xe nhân từ xe phải lịch 05 ngày kể từ ngày nhận Bên Bán gửi. Thống báo sẵn sàng giao xe, do được coi là khoản thanh toán bao lý. Nếu không giao Hợp đồng bao có hiệu lực từ ngày bên kia được /./.</p>
            <p><em>Hợp đồng này có thể từ ngày ký và được thỏa thuận cho đến khi Bên Mua hoàn tất thủ tục nghiệm thu xong xuôi.</em></p>
          </div>

          {/* ĐIỀU 4 */}
          <div className={styles.article}>
            <h4>ĐIỀU 4. BẢN ĐIỀU KHOẢN VÀ ĐIỀU KIỆN CHUNG</h4>
            <p>Bản Điều khoản và Điều kiện chung là một phần không tách rời của gói cơ bản này; bao gồm các nội dung quy định bao này.</p>
            <p><em>Hợp đồng này có hiệu lực từ ngày ký, được lưu giữ tại văn phòng và được giữ đúng bằng (bản) bên, có giá trị pháp lý như nhau.</em></p>
          </div>

          {/* Signatures */}
          <div className={styles.signatures}>
            {signerType === 'manufacturer' ? (
              <>
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN BÁN (Hãng sản xuất)</p>
                  <div className={styles.signatureCanvas}>
                    <canvas
                      ref={canvasRef}
                      width={250}
                      height={120}
                      className={styles.canvas}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                      <div className={styles.placeholder}>
                        <i className="fas fa-pen"></i>
                        <p>Ký tên ở đây</p>
                      </div>
                    )}
                  </div>
                  <p className={styles.signName}>{contract?.manufacturer?.name || 'E-DRIVE VIETNAM'}</p>
                </div>
                
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN MUA (Đại lý)</p>
                  <div className={styles.buyerSignArea}>
                    <p className={styles.emptySignText}>Chờ đại lý ký...</p>
                  </div>
                  <p className={styles.signName}>{contract?.dealer?.name || '___________________'}</p>
                </div>
              </>
            ) : (
              <>
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN BÁN (Hãng sản xuất)</p>
                  <div className={styles.buyerSignArea}>
                    {(contract?.manufacturer?.signatureData || contract?.manufacturerSignatureData) ? (
                      <img 
                        src={contract?.manufacturer?.signatureData || contract?.manufacturerSignatureData || ''} 
                        alt="Chữ ký hãng" 
                        style={{ width: '250px', height: '120px', objectFit: 'contain' }}
                      />
                    ) : (
                      <p className={styles.emptySignText}>Đã ký</p>
                    )}
                  </div>
                  <p className={styles.signName}>{contract?.manufacturer?.name || 'E-DRIVE VIETNAM'}</p>
                </div>
                
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN MUA (Đại lý)</p>
                  <div className={styles.signatureCanvas}>
                    <canvas
                      ref={canvasRef}
                      width={250}
                      height={120}
                      className={styles.canvas}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                      <div className={styles.placeholder}>
                        <i className="fas fa-pen"></i>
                        <p>Ký tên ở đây</p>
                      </div>
                    )}
                  </div>
                  <p className={styles.signName}>{contract?.dealer?.name || '___________________'}</p>
                </div>
              </>
            )}
          </div>
        </div>

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
