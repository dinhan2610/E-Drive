import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import styles from './ExportButtons.module.scss';
import PdfExportModal from './PdfExportModal';

// Register Vietnamese fonts - FIXED VERSION
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

// PDF Styles - OPTIMIZED PROFESSIONAL VERSION
const pdfStyles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
    borderBottom: '3 solid #ff4d30',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 32,
    fontWeight: 700,
    color: '#ff4d30',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  companyInfo: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 3,
    textAlign: 'center',
  },
  divider: {
    marginTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 15,
    letterSpacing: 1,
  },
  date: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
  },
  section: {
    marginBottom: 18,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeft: '4 solid #ff4d30',
  },
  sectionOrange: {
    marginBottom: 18,
    padding: 15,
    backgroundColor: '#fff5f3',
    borderRadius: 6,
    borderLeft: '4 solid #ff4d30',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#ff4d30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: 500,
    color: '#495057',
    width: 130,
  },
  value: {
    fontSize: 10,
    color: '#212529',
    flex: 1,
    fontWeight: 500,
  },
  highlight: {
    backgroundColor: '#ffe6e0',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeft: '4 solid #ff4d30',
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#212529',
    width: 130,
  },
  highlightValue: {
    fontSize: 15,
    fontWeight: 700,
    color: '#ff4d30',
    flex: 1,
  },
  tableContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#ff4d30',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ff4d30',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottom: '1 solid #dee2e6',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
    borderBottom: '1 solid #dee2e6',
  },
  tableCell: {
    fontSize: 10,
    color: '#212529',
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  // Fixed width columns for perfect alignment - all center aligned
  col1: { 
    width: 73,
    textAlign: 'center',
  },
  col2: { 
    width: 131,
    textAlign: 'center',
  },
  col3: { 
    width: 110,
    textAlign: 'center',
  },
  col4: { 
    width: 89,
    textAlign: 'center',
  },
  col5: { 
    width: 121,
    textAlign: 'center',
  },
  notes: {
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 6,
    border: '2 solid #ffc107',
    marginBottom: 20,
    borderLeft: '4 solid #ffc107',
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#d39e00',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 9,
    color: '#495057',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  footer: {
    borderTop: '2 solid #ff4d30',
    paddingTop: 10,
    marginTop: 15,
  },
  disclaimer: {
    fontSize: 9,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 1.4,
  },
});

// Helper functions
const removeVietnameseAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// PDF Document Component
interface PdfDocumentProps {
  carData: {
    modelName: string;
    version: string;
    priceRetail: number;
  };
  calculationData: {
    downPayment: number;
    loanAmount: number;
    monthlyPayment: number;
    term: number;
    totalPayment: number;
    schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  };
}

const FinancingPdfDocument: React.FC<PdfDocumentProps> = ({ carData, calculationData }) => {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  // Show all months including the last one (balance = 0)
  const schedule = calculationData.schedule;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.logo}>E-DRIVE</Text>
          <Text style={pdfStyles.tagline}>Giải pháp di chuyển thông minh - Tương lai xanh</Text>
          <Text style={pdfStyles.companyInfo}>123 Đường Xe Điện, Quận 1, TP.Hồ Chí Minh</Text>
          <Text style={pdfStyles.companyInfo}>
            Hotline: (0123) 456 789 | Email: contact@e-drive.vn
          </Text>
          <View style={pdfStyles.divider} />
        </View>

        {/* Title */}
        <Text style={pdfStyles.title}>BẢNG TÍNH TRẢ GÓP 0% LÃI SUẤT</Text>
        <Text style={pdfStyles.date}>Ngày lập: {currentDate}</Text>

        {/* Vehicle Info */}
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>THÔNG TIN XE</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Dòng xe:</Text>
            <Text style={pdfStyles.value}>{carData.modelName} {carData.version}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Giá bán:</Text>
            <Text style={pdfStyles.value}>{formatCurrency(carData.priceRetail)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Bảo hành:</Text>
            <Text style={pdfStyles.value}>3 năm hoặc 100.000 km</Text>
          </View>
        </View>

        {/* Financing Info */}
        <View style={pdfStyles.sectionOrange}>
          <Text style={pdfStyles.sectionTitle}>THÔNG TIN TRẢ GÓP</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Tiền trả trước:</Text>
            <Text style={pdfStyles.value}>{formatCurrency(calculationData.downPayment)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Số tiền vay:</Text>
            <Text style={pdfStyles.value}>{formatCurrency(calculationData.loanAmount)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Thời hạn vay:</Text>
            <Text style={pdfStyles.value}>{calculationData.term} tháng</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Lãi suất:</Text>
            <Text style={pdfStyles.value}>0% / năm</Text>
          </View>

          {/* Highlight Monthly Payment */}
          <View style={pdfStyles.highlight}>
            <Text style={pdfStyles.highlightLabel}>Trả hàng tháng:</Text>
            <Text style={pdfStyles.highlightValue}>
              {formatCurrency(calculationData.monthlyPayment)}
            </Text>
          </View>

          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Tổng chi phí:</Text>
            <Text style={pdfStyles.value}>{formatCurrency(calculationData.totalPayment)}</Text>
          </View>
        </View>

        {/* Payment Schedule Table */}
        <View style={pdfStyles.tableContainer}>
          <Text style={pdfStyles.tableTitle}>LỊCH THANH TOÁN CHI TIẾT</Text>
          
          {/* Table Header */}
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.col1]}>Kỳ hạn</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.col2]}>Trả hàng tháng</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.col3]}>Gốc</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.col4]}>Lãi</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.col5]}>Còn lại</Text>
          </View>

          {/* Table Rows - Show ALL months including last month */}
          {schedule.map((row, index) => (
            <View key={row.month} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
              <Text style={[pdfStyles.tableCell, pdfStyles.col1]}>
                Tháng {row.month}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.col2]}>
                {formatCurrency(row.payment)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.col3]}>
                {formatCurrency(row.principal)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.col4]}>
                {formatCurrency(row.interest)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.col5]}>
                {formatCurrency(row.balance)}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={pdfStyles.notes}>
          <Text style={pdfStyles.notesTitle}>LƯU Ý QUAN TRỌNG</Text>
          <Text style={pdfStyles.noteText}>
            • Chương trình trả góp 0% lãi suất áp dụng cho khách hàng đủ điều kiện
          </Text>
          <Text style={pdfStyles.noteText}>
            • Khách hàng cần chuẩn bị đầy đủ hồ sơ theo yêu cầu của ngân hàng
          </Text>
          <Text style={pdfStyles.noteText}>
            • Thời gian duyệt hồ sơ: 1-3 ngày làm việc
          </Text>
          <Text style={pdfStyles.noteText}>
            • Để biết thêm thông tin chi tiết, vui lòng liên hệ hotline hoặc showroom
          </Text>
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.disclaimer}>
            Bảng tính này chỉ mang tính chất tham khảo. Vui lòng liên hệ để được tư vấn chi tiết.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Main Export Buttons Component
interface ExportButtonsProps {
  carName: string;
  carData?: {
    modelName: string;
    version: string;
    priceRetail: number;
  };
  calculationData?: {
    downPayment: number;
    loanAmount: number;
    monthlyPayment: number;
    term: number;
    totalPayment: number;
    schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  };
  onConsult?: () => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({
  carName,
  carData,
  calculationData,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'loading';
    fileName?: string;
  }>({
    isOpen: false,
    type: 'success',
    fileName: ''
  });

  const exportToPDF = async () => {
    if (!calculationData || !carData) {
      setModalState({
        isOpen: true,
        type: 'error',
        fileName: ''
      });
      return;
    }

    try {
      setIsExporting(true);
      setModalState({
        isOpen: true,
        type: 'loading',
        fileName: ''
      });

      // Generate PDF blob
      const blob = await pdf(
        <FinancingPdfDocument carData={carData} calculationData={calculationData} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Tra-gop-${removeVietnameseAccents(carName).replace(/\s+/g, '-')}-${timestamp}.pdf`;
      
      link.href = url;
      link.download = filename;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
      
      setModalState({
        isOpen: true,
        type: 'success',
        fileName: filename
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setModalState({
        isOpen: true,
        type: 'error',
        fileName: ''
      });
    } finally {
      setIsExporting(false);
    }
  };

  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false
    });
  };

  return (
    <>
      <div className={styles.exportButtons}>
        <button
          onClick={exportToPDF}
          disabled={isExporting || !calculationData}
          className={`${styles.button} ${styles.pdf}`}
        >
          <i className="fas fa-file-pdf"></i>
          {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
        </button>
      </div>

      <PdfExportModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        fileName={modalState.fileName}
      />
    </>
  );
};

export default ExportButtons;
