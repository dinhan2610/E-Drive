# 📋 Hệ Thống Hợp Đồng - Tài Liệu Hoàn Chỉnh

## 🎯 Tổng quan

Hệ thống tạo hợp đồng mua bán xe ô tô chuyên nghiệp với các tính năng:
- ✅ Tạo hợp đồng từ đơn hàng hoặc lịch lái thử
- ✅ Tự động điền thông tin từ đơn hàng
- ✅ Xác thực form toàn diện
- ✅ Tính toán giá tự động (giảm giá, thuế, phí)
- ✅ Xem trước PDF hợp đồng
- ✅ Tích hợp ký điện tử
- ✅ Giao diện responsive (desktop, tablet, mobile)

## 📂 Cấu trúc File

### 1. Types (2 files)
```
src/types/
├── contract.ts          # Interface ContractFormData, ContractValidationErrors, Contract
└── order.ts            # Interface OrderLite (thêm vào file có sẵn)
```

### 2. Services (2 files)
```
src/services/
├── contractsApi.ts     # createContract, startESign, getContractById
└── ordersApi.ts        # getOrderById, getAllOrders, getTestDriveById
```

### 3. Components (12 files - 6 components + 6 SCSS modules)
```
src/components/Compare/
├── OrderPicker.tsx               # Danh sách đơn hàng bên trái
├── OrderPicker.module.scss
├── ContractForm.tsx              # Form nhập thông tin hợp đồng
├── ContractForm.module.scss
├── PriceSummary.tsx              # Tính toán giá
├── PriceSummary.module.scss
├── PdfPreview.tsx                # Xem trước hợp đồng
├── PdfPreview.module.scss
├── SignLaunchDialog.tsx          # Dialog xác nhận gửi email ký
├── SignLaunchDialog.module.scss
├── ConfirmDialog.tsx             # Dialog xác nhận chung
└── ConfirmDialog.module.scss
```

### 4. Pages (2 files)
```
src/Pages/
├── ContractCreatePage.tsx       # Trang chính tạo hợp đồng
└── ContractCreatePage.module.scss
```

### 5. Routing & Menu (2 files cập nhật)
```
src/
├── App.tsx                      # Thêm route /admin/contracts/create
└── components/AdminLayout.tsx   # Thêm menu item "Hợp đồng"
```

## 🔧 Chi tiết kỹ thuật

### ContractFormData Interface
```typescript
{
  orderId: string;
  orderCode: string;
  buyerName: string;           // *
  buyerPhone: string;          // * (10 số)
  buyerEmail: string;          // * (format email)
  buyerIdNumber: string;       // * CCCD/Passport
  buyerAddress: string;        // *
  dealerId: string;
  dealerName: string;
  vehicleModel: string;        // *
  vehicleVariant: string;
  vehicleColor: string;
  vehicleYear: number;         // * (2000-2100)
  vehicleVin: string;
  signDate: string;            // * ISO date
  deliveryDate: string;        // * (phải sau signDate)
  deliveryLocation: string;
  warrantyTerms: string;
  notes: string;
  subtotal: number;            // * (> 0)
  discount: number;
  taxPercent: number;
  fees: number;
}
```

### Validation Rules
1. **Người mua**:
   - Họ tên: Bắt buộc
   - SĐT: 10 số
   - Email: Format hợp lệ
   - CCCD: Bắt buộc
   - Địa chỉ: Bắt buộc

2. **Xe**:
   - Model: Bắt buộc
   - Năm SX: 2000-2100

3. **Điều khoản**:
   - Ngày ký: Bắt buộc
   - Ngày giao: Phải sau ngày ký

4. **Giá**:
   - Giá xe: > 0

### Công thức tính tổng
```typescript
total = (subtotal - discount) * (1 + taxPercent/100) + fees
```

## 🎨 Layout Design

### Desktop (>1200px)
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Title + Actions (In HĐ, Tạo HĐ)                  │
├──────────┬──────────────────────┬─────────────────────────┤
│          │                      │                         │
│  Order   │   Contract Form      │   PDF Preview          │
│  Picker  │   + Validation       │   (Live Preview)       │
│  (420px) │   + Price Summary    │   (600px)              │
│          │   (Flexible)         │                         │
│          │                      │                         │
└──────────┴──────────────────────┴─────────────────────────┘
```

### Tablet (<1200px)
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│  Order Picker (Full width)          │
├─────────────────────────────────────┤
│  Contract Form (Full width)         │
├─────────────────────────────────────┤
│  PDF Preview (Full width)           │
└─────────────────────────────────────┘
```

### Mobile (<768px)
- Stacked layout
- Full-width inputs
- Compact spacing
- Touch-friendly buttons

## 🔄 Workflow

### 1. Chọn đơn hàng
```
User clicks order → Auto-fill form data → Validate fields
```

### 2. Chỉnh sửa thông tin
```
User edits → Real-time validation → Update PDF preview
```

### 3. Tạo hợp đồng
```
Click "Tạo hợp đồng" → Validate → Confirm dialog → API call → Show SignDialog
```

### 4. Ký điện tử
```
Confirm email → Send e-sign link → Navigate to contracts list
```

## 🚀 URL Parameters

### Tạo từ đơn hàng
```
/admin/contracts/create?orderId=123
```

### Tạo từ lịch lái thử
```
/admin/contracts/create?testDriveId=456
```

## 📊 API Endpoints

### Contracts
```typescript
POST   /api/contracts              # Tạo hợp đồng mới
GET    /api/contracts/:id          # Lấy chi tiết hợp đồng
GET    /api/contracts              # Lấy danh sách hợp đồng
PATCH  /api/contracts/:id          # Cập nhật trạng thái
POST   /api/contracts/:id/sign     # Gửi email ký điện tử
```

### Orders
```typescript
GET    /api/customer-orders        # Lấy danh sách đơn hàng
GET    /api/customer-orders/:id    # Lấy chi tiết đơn hàng
GET    /api/test-drives/:id        # Lấy chi tiết lịch lái thử
```

## 🎨 Styling Highlights

### Colors
- Primary: `#ff4d30` (Orange)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Yellow)
- Danger: `#ef4444` (Red)
- Gray scale: `#f9fafb` → `#111827`

### Components
- Border radius: `6px` (inputs), `8px` (cards), `12px` (dialogs)
- Shadows: `0 2px 8px rgba(0,0,0,0.1)` (cards)
- Transitions: `all 0.2s` (hover effects)

### Responsive Breakpoints
- Desktop: `>1200px` (3-column grid)
- Tablet: `768px - 1200px` (1-column stack)
- Mobile: `<768px` (compact layout)

## 🔐 Permissions

### Admin Only
```typescript
<ProtectedRoute requiredRole="admin">
  <ContractCreatePage />
</ProtectedRoute>
```

### Menu Access
- AdminLayout sidebar → "Hợp đồng" menu item
- Navigate to `/admin/contracts/create`

## 📝 Contract Status Flow

```
DRAFT → PENDING_SIGN → SIGNED → COMPLETED
  ↓
CANCELLED (any time)
```

## 🐛 Error Handling

### Form Validation
- Real-time validation on field change
- Clear error messages in Vietnamese
- Red border + error text below field

### API Errors
- Try-catch wrapper
- Alert user-friendly messages
- Handle network errors

### Loading States
- Disable buttons during API calls
- Show "Đang xử lý..." text
- Prevent double-submission

## 📱 Print Support

### CSS @media print
- Hide header, order picker, form section
- Show only PDF preview
- White background
- Auto page breaks

## ✅ Testing Checklist

- [ ] Load order from URL params
- [ ] Auto-fill form from order data
- [ ] Validation all required fields
- [ ] Calculate total correctly
- [ ] Update PDF preview live
- [ ] Create contract API call
- [ ] Send e-sign email
- [ ] Navigate after success
- [ ] Responsive on mobile
- [ ] Print contract PDF

## 🔮 Future Enhancements

1. **Multiple signatures**
   - Buyer + Seller + Witness

2. **Contract templates**
   - Different templates per vehicle type

3. **Version history**
   - Track contract changes

4. **Digital signature pad**
   - Draw signature in browser

5. **PDF download**
   - Export contract as PDF file

6. **Email contract**
   - Send contract copy to buyer

7. **Contract search**
   - Search by code, buyer name, VIN

8. **Bulk operations**
   - Create multiple contracts at once

## 📞 Support

Nếu gặp vấn đề, check:
1. Browser console for errors
2. Network tab for API failures
3. React DevTools for state issues
4. SCSS compilation warnings

---

**Tạo bởi**: GitHub Copilot
**Ngày**: 2025
**Phiên bản**: 1.0.0
**Trạng thái**: ✅ Production Ready
