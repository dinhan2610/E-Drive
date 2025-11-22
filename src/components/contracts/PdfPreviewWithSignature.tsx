import React from 'react';
import type { ContractPayload } from '../../types/contract';
import styles from './PdfPreview.module.scss';

interface PdfPreviewWithSignatureProps {
  payload: ContractPayload;
  contractNo?: string;
  signerType: 'manufacturer' | 'dealer';
  manufacturerSignature?: string;
  dealerSignature?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  hasSignature?: boolean;
  onMouseDown?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLCanvasElement>) => void;
}

const PdfPreviewWithSignature = React.forwardRef<HTMLDivElement, PdfPreviewWithSignatureProps>(
  ({ 
    payload, 
    contractNo, 
    signerType,
    manufacturerSignature,
    dealerSignature,
    canvasRef,
    hasSignature,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }, ref) => {
  
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

  // Convert number to Vietnamese words
  const numberToVietnameseWords = (num: number): string => {
    if (num === 0) return 'Không đồng';
    
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const thousands = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];

    const convertThreeDigits = (n: number): string => {
      if (n === 0) return '';
      
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      
      let result = '';
      
      if (hundred > 0) {
        result += ones[hundred] + ' trăm';
        if (remainder > 0 && remainder < 10) {
          result += ' lẻ';
        }
      }
      
      if (ten === 0 && one > 0) {
        result += ' ' + ones[one];
      } else if (ten === 1) {
        result += ' ' + teens[remainder - 10];
      } else if (ten > 1) {
        result += ' ' + tens[ten];
        if (one === 1) {
          result += ' mốt';
        } else if (one === 5 && ten > 1) {
          result += ' lăm';
        } else if (one > 0) {
          result += ' ' + ones[one];
        }
      }
      
      return result.trim();
    };

    // Split number into groups of 3 digits
    const groups: number[] = [];
    let tempNum = Math.floor(num);
    while (tempNum > 0) {
      groups.unshift(tempNum % 1000);
      tempNum = Math.floor(tempNum / 1000);
    }

    let result = '';
    for (let i = 0; i < groups.length; i++) {
      if (groups[i] > 0) {
        const groupText = convertThreeDigits(groups[i]);
        const thousandText = thousands[groups.length - i - 1];
        result += groupText + (thousandText ? ' ' + thousandText : '') + ' ';
      }
    }

    return result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + ' đồng chẵn';
  };

  // Calculate pricing
  const quantity = payload.order?.orderItems?.[0]?.quantity || 1;
  const unitPrice = payload.pricing.subtotal / quantity;

  // Get order code
  const orderCode = payload.order?.code || 'N/A';

  return (
    <div className={styles.preview}>
      <div className={styles.previewArea}>
        <div ref={ref} className={styles.printArea}>
          {/* Header */}
          <div className={styles.contractHeader}>
            <div className={styles.leftColumn}>
              <div className={styles.companyInfo}>
                <h3>CÔNG TY E-DRIVE VIỆT NAM</h3>
                <p><strong>MSDN:</strong> {payload.manufacturer?.taxCode || '0123456789'}</p>
                <p><strong>Địa chỉ:</strong> {payload.manufacturer?.address || '123 Đường Điện Biên Phủ, Quận 1, TP.HCM'}</p>
                <p><strong>Điện thoại:</strong> {payload.manufacturer?.phone || '(0123) 456 789'}</p>
                <p>Kết nối giữa các bên:</p>
              </div>
              
              <div className={styles.partyInfo}>
                <p><strong>BÊN A: MUA (Đại lý)</strong></p>
                <p><strong>Tên người đại diện:</strong> {payload.dealer.representative || '__________'}</p>
                <p><strong>Đại diện:</strong> {payload.dealer.name}</p>
                <p><strong>Địa chỉ:</strong> {payload.dealer.address || 'Chưa cập nhật'}</p>
                <p><strong>Số điện thoại:</strong> {payload.dealer.phone || 'Chưa cập nhật'}</p>
                <p><strong>Chức vụ:</strong> Quản lý</p>
              </div>
              
              <div className={styles.partyInfo}>
                <p><strong>BÊN B: BÁN (Hãng sản xuất)</strong></p>
                <p><strong>Văn phòng:</strong> Tại các Trưởng Phòng Kinh Doanh Trưng Bày, Tư vấn</p>
                <p><strong>Đại diện:</strong> {payload.manufacturer?.name || 'E-DRIVE VIETNAM'}</p>
                <p><strong>Tên người đại diện:</strong> Thân Trọng An</p>
                <p><strong>Số điện thoại:</strong> 0912345678</p>
                <p><strong>Chức vụ:</strong> Giám đốc</p>
              </div>
            </div>
            
            <div className={styles.rightColumn}>
              <h1 className={styles.mainTitle}>HỢP ĐỒNG MUA BÁN XE</h1>
              <p className={styles.contractNo}>Số: <strong>{contractNo || 'CT-DRAFT'}</strong> - BMW/VL</p>
              <p className={styles.contractDate}>Ký vào ngày {formatDate(payload.order?.orderDate)} tại</p>
              <p className={styles.note}>Ký với giấy các bên:</p>
            </div>
          </div>

          {/* ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG */}
          <div className={styles.article}>
            <h4>ĐIỀU 1. ĐỐI TƯỢNG HỢP ĐỒNG</h4>
            <p>Căn cứ theo đơn hàng số {orderCode} do Hợp đồng này có hiệu lực từ ngày {formatDate(payload.order?.orderDate)} ("Hợp đồng") với các đại điểm sau:</p>
            
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
                {payload.order?.orderItems && payload.order.orderItems.length > 0 ? (
                  <>
                    {payload.order.orderItems.map((item, index) => {
                      const vehicleName = item.vehicleName || '';
                      const vehicleParts = vehicleName.split(' ');
                      const vehicleModel = vehicleParts.slice(0, 2).join(' ');

                      const vehicleVersion = item.vehicleVersion || (item as any).vehicleVariant || (item as any).variant ||
                        payload.order?.vehicle?.variant || (vehicleParts.length > 2 ? vehicleParts.slice(2).join(' ') : '') ||
                        'Standard';
                      
                      const priceAfterDiscount = item.itemSubtotal - item.itemDiscount;
                      const unitPriceWithVAT = (item.unitPrice - (item.itemDiscount / item.quantity)) * (1 + (payload.order?.money.taxPercent || 10) / 100);
                      const totalWithVAT = priceAfterDiscount * (1 + (payload.order?.money.taxPercent || 10) / 100);
                      
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
                          {payload.order.orderItems.reduce((sum, item) => sum + item.quantity, 0).toString().padStart(2, '0')}
                        </strong>
                      </td>
                      <td className={styles.rightText}><strong></strong></td>
                      <td className={styles.rightText}>
                        <strong>
                          {formatCurrency(payload.order?.money?.total || payload.pricing.total)}
                        </strong>
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td>01</td>
                      <td>
                        <div className={styles.vehicleDesc}>
                          <p><strong>XE Ô TÔ ĐIỆN {payload.vehicle.model?.toUpperCase()}</strong></p>
                          <p>- Phiên bản: {payload.vehicle.variant || 'Standard'}</p>
                          <p>- Số chỗ ngồi: 05 chỗ</p>
                          <p>- Nguồn gốc xuất xứ: Xe được nhập khẩu nguyên chiếc.</p>
                          <p>- Màu sơn: {payload.vehicle.color || 'Chưa xác định'}</p>
                          <p>- Năm sản xuất: {new Date().getFullYear()}</p>
                          <p>- Màu nội thất: Đen</p>
                          <p>- Chế động và quy cách: Một 100%; tay lái thuận tay với các thiết bị kỹ thuật theo quy chuẩn và có nhãn hàng xuất sản xuất.</p>
                        </div>
                      </td>
                      <td className={styles.centerText}>{quantity.toString().padStart(2, '0')}</td>
                      <td className={styles.rightText}>{formatCurrency(unitPrice)}</td>
                      <td className={styles.rightText}>{formatCurrency(unitPrice * quantity)}</td>
                    </tr>
                    <tr className={styles.totalRow}>
                      <td colSpan={2}><strong>Tổng Giá trị Hợp đồng</strong></td>
                      <td className={styles.centerText}><strong>{quantity.toString().padStart(2, '0')}</strong></td>
                      <td className={styles.rightText}><strong>{formatCurrency(unitPrice)}</strong></td>
                      <td className={styles.rightText}><strong>{formatCurrency(payload.pricing.subtotal)}</strong></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            
            <p className={styles.note}>
              <em>Bằng chữ: {numberToVietnameseWords(payload.pricing.total)} (Đã gồm toàn bộ mọi khoản thuế phí theo pháp luật hiện hành /,/.</em>
            </p>
          </div>

          {/* ĐIỀU 2: ĐẶT CỌC VÀ THANH TOÁN */}
          <div className={styles.article}>
            <h4>ĐIỀU 2. ĐẶT CỌC VÀ THANH TOÁN</h4>
            <ul>
              <li>Thời hạn giao xe: Trong tháng {formatDate(payload.terms.deliveryDate || payload.order?.desiredDeliveryDate)}.</li>
              <li>Địa điểm giao xe: Tại cơ sở từ việc kho của Bên Bán theo cơ sở tại Hợp đồng của bên giao nơi từ nay đặt xe giao không nhân được bên khác (Bên) bao, có ghi rõ lý do và phải lấy trả bằng giấy.</li>
            </ul>
          </div>

          {/* ĐIỀU 3: THÔNG TIN GIAO NHẬN VÀ CHẤT LƯỢNG SẢN PHẨM */}
          <div className={styles.article}>
            <h4>ĐIỀU 3. THÔNG TIN GIAO NHẬN VÀ CHẤT LƯỢNG SẢN PHẨM</h4>
            <p>Bên Mua phải giao xe: Xe được bàn giao phải là xe mới 100%, theo đúng chuẩn loại trong Mã Hợp đồng bao. Thống báo sẵn sàng giao xe; Bên trong sau khi xe nhân từ xe phải lịch 05 ngày kể từ ngày nhận Bên Bán gửi. Thống báo sẵn sàng giao xe, do được coi là khoản thanh toán bao lý. Nếu không giao Hợp đồng bao có hiệu lực từ ngày bên kia được /./.</p>
            <p><em>Hợp đồng này có thể từ ngày ký và được thỏa thuận cho đến khi Bên Mua hoàn tất thủ tục nghiệm thu xong xuôi.</em></p>
          </div>

          {/* ĐIỀU 4: BẢN ĐIỀU KHOẢN VÀ ĐIỀU KIỆN CHUNG */}
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
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN BÁN</p>
                  <div className={styles.signatureCanvas} style={{ position: 'relative', width: '250px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <canvas
                      ref={canvasRef}
                      width={250}
                      height={120}
                      style={{ display: 'block', cursor: 'crosshair' }}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseLeave}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    />
                    {!hasSignature && (
                      <div style={{ position: 'absolute', textAlign: 'center', color: '#999', pointerEvents: 'none' }}>
                        <i className="fas fa-pen"></i>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Ký tên ở đây</p>
                      </div>
                    )}
                  </div>
                  <p className={styles.signName}>Thân Trọng An</p>
                </div>
                
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN MUA</p>
                  <div className={styles.signArea} style={{ width: '250px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#999', fontSize: '14px' }}>Chờ đại lý ký...</p>
                  </div>
                  <p className={styles.signName}>{payload.dealer?.representative || ''}</p>
                </div>
              </>
            ) : (
              <>
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN BÁN</p>
                  <div className={styles.signArea} style={{ width: '250px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {manufacturerSignature ? (
                      <img 
                        src={manufacturerSignature} 
                        alt="Chữ ký hãng" 
                        style={{ width: '250px', height: '120px', objectFit: 'contain' }}
                      />
                    ) : (
                      <p style={{ color: '#999', fontSize: '14px' }}>Đã ký</p>
                    )}
                  </div>
                  <p className={styles.signName}>Thân Trọng An</p>
                </div>
                
                <div className={styles.signatureBlock}>
                  <p className={styles.signTitle}>ĐẠI DIỆN BÊN MUA</p>
                  <div className={styles.signatureCanvas} style={{ position: 'relative', width: '250px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <canvas
                      ref={canvasRef}
                      width={250}
                      height={120}
                      style={{ display: 'block', cursor: 'crosshair' }}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseLeave}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                    />
                    {!hasSignature && (
                      <div style={{ position: 'absolute', textAlign: 'center', color: '#999', pointerEvents: 'none' }}>
                        <i className="fas fa-pen"></i>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Ký tên ở đây</p>
                      </div>
                    )}
                  </div>
                  <p className={styles.signName}>{payload.dealer?.representative || ''}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PdfPreviewWithSignature.displayName = 'PdfPreviewWithSignature';

export default PdfPreviewWithSignature;
