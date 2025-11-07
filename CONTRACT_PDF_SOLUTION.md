# 📄 GIẢI PHÁP LƯU TRỮ & HIỂN THỊ HỢP ĐỒNG PDF

## 🎯 TỔNG QUAN

### Vấn đề
- Frontend có nhiều **điều khoản hardcode** (bảo hành, thanh toán, phụ lục, etc.)
- Backend API chỉ nhận `{dealerId, orderId, terms}` - không lưu toàn bộ nội dung
- Khi GET contract, không có thông tin hardcode → Hợp đồng thiếu nội dung

### Giải pháp đã triển khai
✅ **Tự động generate PDF khi tạo hợp đồng**
- PDF chứa đầy đủ thông tin: điều khoản, bảo hành, thanh toán, phụ lục
- Lưu PDF vĩnh viễn → Không lo thay đổi template
- Có giá trị pháp lý

---

## 🔧 TRIỂN KHAI HIỆN TẠI

### 1. Khi tạo hợp đồng mới (`ContractCreatePage_new.tsx`)

```typescript
const handleCreateContract = async () => {
  // Bước 1: Tạo contract trong database
  const contract = await createContract(payload);
  
  // Bước 2: Tự động generate PDF từ preview
  await generateAndSavePdf(contract.id);
  
  // PDF được lưu với tên: contract-{contractId}.pdf
}
```

### 2. Generate PDF (`generateAndSavePdf()`)

**Input:**
- `previewRef.current` - DOM element chứa toàn bộ nội dung hợp đồng
- `contractId` - ID của hợp đồng vừa tạo

**Process:**
1. Dùng `html2canvas` chuyển HTML → Canvas
2. Dùng `jsPDF` chuyển Canvas → PDF (A4, nhiều trang)
3. Convert PDF → Blob
4. **Hiện tại:** Lưu vào `localStorage` (demo)
5. **Production:** Upload lên server/cloud storage

**Output:**
- File PDF hoàn chỉnh với tất cả điều khoản hardcode
- Lưu tại: `localStorage['contract-pdf-{contractId}']`

### 3. Xem PDF (`handleViewContractPdf()`)

```typescript
const handleViewContractPdf = (contract: Contract) => {
  // 1. Thử lấy từ localStorage (demo)
  const savedPdf = localStorage.getItem(`contract-pdf-${contract.id}`);
  
  if (savedPdf) {
    // Mở PDF trong tab mới
    window.open().document.write(embed PDF)
  } else if (contract.pdfUrl) {
    // 2. Fallback: Lấy từ server
    window.open(contract.pdfUrl, '_blank');
  }
}
```

---

## 🚀 TRIỂN KHAI PRODUCTION

### Bước 1: Tạo API Upload PDF

**Backend cần thêm API:**

```typescript
// POST /api/contracts/{id}/upload-pdf
// Upload file PDF và trả về URL

interface UploadPdfRequest {
  file: File (multipart/form-data)
}

interface UploadPdfResponse {
  pdfUrl: string  // URL của file PDF đã upload
}
```

### Bước 2: Tích hợp Cloud Storage

**Khuyến nghị:** AWS S3, Google Cloud Storage, hoặc Azure Blob Storage

**Workflow:**

```
Frontend                    Backend                 Cloud Storage
   |                           |                          |
   |-- Generate PDF --------->|                          |
   |                           |-- Upload to S3 -------->|
   |                           |<-- Return URL -----------|
   |<-- Save pdfUrl ----------|                          |
   |                           |                          |
```

### Bước 3: Update Frontend Code

**File:** `src/services/contractsApi.ts`

```typescript
// Thêm function upload PDF
export async function uploadContractPdf(
  contractId: string, 
  pdfFile: Blob
): Promise<string> {
  const formData = new FormData();
  formData.append('file', pdfFile, `contract-${contractId}.pdf`);
  
  const response = await apiClient.post<{ pdfUrl: string }>(
    `/api/contracts/${contractId}/upload-pdf`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data.pdfUrl;
}
```

**File:** `src/Pages/ContractCreatePage_new.tsx`

```typescript
const generateAndSavePdf = async (contractId: string) => {
  // ... (generate PDF code)
  
  const pdfBlob = pdf.output('blob');
  
  // PRODUCTION: Upload to server
  const pdfUrl = await uploadContractPdf(contractId, pdfBlob);
  console.log('✅ PDF uploaded:', pdfUrl);
  
  // OPTIONAL: Update contract with pdfUrl
  // await updateContract(contractId, { pdfUrl });
}
```

### Bước 4: Update Backend Contract Model

```typescript
interface Contract {
  id: string;
  dealerId: number;
  orderId: string;
  terms: string;  // JSON string
  pdfUrl?: string;  // ⭐ Thêm field này
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📦 LUỒNG DỮ LIỆU HOÀN CHỈNH

### Tạo hợp đồng mới

```
1. User điền form → ContractCreatePage
2. Click "Tạo hợp đồng"
3. POST /api/contracts → Backend lưu {dealerId, orderId, terms}
4. Frontend generate PDF từ PdfPreview component
5. Upload PDF → Cloud Storage → Nhận pdfUrl
6. (Optional) PATCH /api/contracts/{id} → Update pdfUrl vào database
7. Hiển thị thông báo thành công
```

### Xem hợp đồng

```
1. User click icon PDF trong table
2. GET contract từ state → Lấy contract.pdfUrl
3. window.open(pdfUrl) → Mở PDF trong tab mới
4. User xem/download PDF
```

---

## 🎨 NỘI DUNG PDF BAO GỒM

### Thông tin từ API (Dynamic)
- ✅ Thông tin đơn hàng (orderId, orderDate, deliveryDate)
- ✅ Thông tin khách hàng (buyer)
- ✅ Thông tin đại lý (dealer)
- ✅ Thông tin xe (vehicle: model, variant, color, VIN)
- ✅ Thông tin giá (pricing: subtotal, discount, tax, total)

### Điều khoản Hardcode (Static)
- ✅ **Phương thức thanh toán** (Tiền mặt, Chuyển khoản, VNPAY, Thẻ)
- ✅ **Tiến độ thanh toán** (100%, 70/30, đặt cọc 20%)
- ✅ **Bảo hành tổng thể** (3 năm/100.000 km)
- ✅ **Bảo hành pin** (8 năm/160.000 km, 70% dung lượng)
- ✅ **Bảo dưỡng định kỳ** (1.000km, 5.000km, 10.000km)
- ✅ **Điều kiện từ chối bảo hành**
- ✅ **Phụ lục/Đính kèm** (Checklist, hóa đơn, CCCD, etc.)
- ✅ **Dịch vụ hỗ trợ** (Cứu hộ 24/7, Hotline, App)

---

## ⚡ TỐI ƯU HÓA

### 1. Compression
```typescript
// Giảm kích thước PDF
const pdfBlob = pdf.output('blob');
const compressedBlob = await compressPdf(pdfBlob);
```

### 2. Watermark
```typescript
// Thêm watermark "DRAFT" cho hợp đồng chưa ký
if (contract.status === 'DRAFT') {
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(60);
  pdf.text('DRAFT', 105, 148, { angle: 45 });
}
```

### 3. Digital Signature
```typescript
// Tích hợp chữ ký điện tử
import { signPdf } from '@signpdf/signpdf';

const signedPdf = await signPdf(pdfBlob, certificate);
```

### 4. Email Automation
```typescript
// Tự động gửi PDF qua email khi submit
const handleSubmitContract = async () => {
  await submitContract(contractId);
  await sendContractEmail(contract.buyer.email, pdfUrl);
}
```

---

## 🔒 BẢO MẬT

### 1. Access Control
```typescript
// Chỉ cho phép dealer/admin xem PDF của chính họ
const canViewPdf = (user, contract) => {
  return user.role === 'admin' || 
         user.id === contract.dealerId;
}
```

### 2. Signed URLs (S3)
```typescript
// Generate URL có thời hạn (15 phút)
const signedUrl = await s3.getSignedUrl('getObject', {
  Bucket: 'contracts',
  Key: `contract-${id}.pdf`,
  Expires: 900  // 15 minutes
});
```

### 3. Encryption
- Lưu PDF dạng mã hóa trên server
- Decrypt khi user request

---

## 📊 THEO DÕI

### Metrics cần monitor
- Số lượng PDF được generate
- Thời gian generate PDF (nên < 3s)
- Kích thước file PDF trung bình
- Storage usage
- Download count

### Logging
```typescript
console.log('Contract created:', {
  contractId,
  pdfGenerated: true,
  pdfSize: `${(pdfBlob.size / 1024).toFixed(2)} KB`,
  uploadTime: `${uploadDuration}ms`,
  pdfUrl
});
```

---

## 🆘 XỬ LÝ LỖI

### Lỗi thường gặp

**1. PDF không generate được**
```typescript
try {
  await generateAndSavePdf(contractId);
} catch (error) {
  // Fallback: Cho phép tải lại sau
  console.error('PDF generation failed:', error);
  // Vẫn lưu contract, nhưng không có PDF
}
```

**2. Upload lỗi**
```typescript
try {
  const pdfUrl = await uploadContractPdf(contractId, pdfBlob);
} catch (error) {
  // Retry mechanism
  await retryUpload(contractId, pdfBlob, maxRetries: 3);
}
```

**3. Storage đầy**
```typescript
// Implement cleanup cho các draft cũ
await cleanupOldDraftPdfs();
```

---

## ✅ CHECKLIST TRIỂN KHAI

### Phase 1: Demo (Hiện tại)
- [x] Generate PDF từ HTML
- [x] Lưu PDF vào localStorage
- [x] Xem PDF từ localStorage
- [x] Download PDF

### Phase 2: Production
- [ ] Setup Cloud Storage (S3/GCS/Azure)
- [ ] Tạo API upload PDF
- [ ] Tích hợp upload trong frontend
- [ ] Update Contract model thêm `pdfUrl`
- [ ] Test upload/download

### Phase 3: Enhancement
- [ ] PDF compression
- [ ] Watermark cho DRAFT
- [ ] Digital signature
- [ ] Email automation
- [ ] Access control
- [ ] Monitoring & logging

---

## 🎓 KẾT LUẬN

### Ưu điểm giải pháp
✅ Lưu trữ vĩnh viễn toàn bộ điều khoản hardcode
✅ Không lo thay đổi template ảnh hưởng hợp đồng cũ  
✅ Có giá trị pháp lý
✅ Dễ chia sẻ, in ấn, gửi email
✅ Tự động hóa hoàn toàn

### Next Steps
1. Test kỹ PDF generation với nhiều loại hợp đồng
2. Setup cloud storage
3. Implement upload API
4. Deploy production
5. Monitor & optimize

---

**Liên hệ support:** 
- Email: dev@edrive.vn
- Hotline: 1900-1111
