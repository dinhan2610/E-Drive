import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import styles from './ExportButtons.module.scss';

interface ExportButtonsProps {
  printAreaRef: React.RefObject<HTMLDivElement>;
  carName: string;
  onConsult: () => void;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ printAreaRef, carName, onConsult }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;

    try {
      setIsExporting(true);

      // Capture the print area as canvas
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Generate filename with car name and timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Tra-gop-${carName.replace(/\s+/g, '-')}-${timestamp}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.exportButtons}>
      <button
        type="button"
        className={`${styles.button} ${styles.pdf}`}
        onClick={handleExportPDF}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            Đang xuất...
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf"></i>
            Xuất PDF
          </>
        )}
      </button>

      <button
        type="button"
        className={`${styles.button} ${styles.consult}`}
        onClick={onConsult}
      >
        <i className="fas fa-headset"></i>
        Gửi yêu cầu tư vấn
      </button>
    </div>
  );
};

export default ExportButtons;
