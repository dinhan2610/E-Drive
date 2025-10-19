# Kết nối API Thật cho Trang Products

## 🎯 Tổng quan

Đã **XOÁ hoàn toàn mock data** và kết nối API thật từ backend Spring Boot cho trang ProductsPage.

---

## ✅ Những gì đã làm

### 1. **Cập nhật ProductsPage.tsx**

**Trước (Mock Data):**
```typescript
import { CAR_DATA, type CarType } from '../constants/CarDatas';
// ...sử dụng CAR_DATA và convert thủ công
```

**Sau (Real API):**
```typescript
import { fetchVehiclesFromApi, convertVehicleToProduct } from '../services/vehicleApi';

// Gọi API thật trong useEffect
const { vehicles, total } = await fetchVehiclesFromApi({
  page: currentPage - 1,    // API dùng 0-based index
  size: currentPageSize,
  search: currentFilters.q,
  minPrice: currentFilters.priceMin,
  maxPrice: currentFilters.priceMax,
});

// Convert sang UI format
let productList = vehicles.map(convertVehicleToProduct);
```

### 2. **Cải thiện vehicleApi.ts**

**Hỗ trợ 2 format response:**
```typescript
// Format 1: Array trực tiếp
[{ vehicleId: 1, ... }, ...]

// Format 2: Wrapper object
{
  statusCode: 200,
  message: "...",
  data: [{ vehicleId: 1, ... }]
}
```

**Auto-detect và xử lý:**
```typescript
if (Array.isArray(data)) {
  vehicles = data;
} else if (data.statusCode && data.data) {
  vehicles = data.data;
}
```

### 3. **Mapping dữ liệu tối ưu**

**API Response → UI Product:**
```typescript
{
  vehicleId: 1,
  modelName: "E-Car A",
  version: "Standard",
  color: "Red",
  batteryCapacityKwh: 70,
  rangeKm: 380,
  priceRetail: 1150000000,
  status: "DISCONTINUED"
}
↓
{
  id: "1",
  name: "E-Car A Standard",
  variant: "Standard",
  price: 1150000000,
  rangeKm: 380,
  battery: "70 kWh",
  motor: "140 kW",
  fastCharge: "1.5h",
  inStock: false,  // status === "AVAILABLE"
  tags: ["red"]
}
```

---

## 🔌 API Endpoint

**URL:** `http://localhost:8080/api/vehicles`

**Query Parameters:**
- `page`: Số trang (0-based, mặc định: 0)
- `size`: Số items/trang (mặc định: 10)
- `search`: Tìm kiếm (optional)
- `minPrice`: Giá tối thiểu (optional)
- `maxPrice`: Giá tối đa (optional)
- `status`: AVAILABLE hoặc DISCONTINUED (optional)

**Ví dụ:**
```
GET http://localhost:8080/api/vehicles?page=0&size=10
GET http://localhost:8080/api/vehicles?page=1&size=12&search=E-Car
GET http://localhost:8080/api/vehicles?minPrice=1000000000&maxPrice=2000000000
```

---

## 📊 Response Format

**Backend trả về:**
```json
[
  {
    "vehicleId": 1,
    "modelName": "E-Car A",
    "version": "Standard",
    "color": "Red",
    "batteryCapacityKwh": 70,
    "rangeKm": 380,
    "maxSpeedKmh": 145,
    "chargingTimeHours": 1.5,
    "seatingCapacity": 5,
    "motorPowerKw": 140,
    "weightKg": 1750,
    "lengthMm": 4450,
    "widthMm": 1800,
    "heightMm": 1580,
    "priceRetail": 1150000000,
    "status": "DISCONTINUED",
    "manufactureYear": 2022
  }
]
```

---

## 🚀 Tính năng được giữ nguyên

✅ **Pagination** - Phân trang với page size tùy chỉnh
✅ **Search** - Tìm kiếm (backend xử lý)
✅ **Price Filter** - Lọc theo giá min/max
✅ **Sorting** - Sắp xếp theo giá, tên, ngày
✅ **Responsive** - Container đẹp mọi màn hình
✅ **Loading State** - Hiển thị loading khi gọi API
✅ **Empty State** - Hiển thị khi không có sản phẩm
✅ **Error Handling** - Bắt lỗi và log chi tiết

---

## 🔧 Error Handling

**Console logs chi tiết:**
```typescript
console.log('🌐 Fetching from API:', url);
console.log('✅ API Response:', data);
console.log('✅ Products loaded from API:', { total, productsLoaded });
console.error('❌ API Error:', error);
```

**Xử lý lỗi:**
- Network error → Log và hiển thị empty state
- API error → Log message và hiển thị empty state
- Invalid format → Throw error với message rõ ràng

---

## 📝 Files đã sửa

1. **src/Pages/ProductsPage.tsx**
   - ❌ Xoá import CAR_DATA
   - ❌ Xoá convertCarToProduct function
   - ❌ Xoá allProducts mock data
   - ✅ Import fetchVehiclesFromApi, convertVehicleToProduct
   - ✅ Gọi API trong useEffect async
   - ✅ Error handling với try-catch

2. **src/services/vehicleApi.ts**
   - ✅ Hỗ trợ 2 format response (array hoặc wrapper)
   - ✅ Auto-detect response structure
   - ✅ Improved error logging
   - ✅ Flexible total calculation

---

## 🎨 UI/UX không đổi

- Container rộng đồng bộ với Home (1400px @ xxl)
- Grid responsive: 1 col → 2 cols → 3 cols → 4 cols
- SortBar cuộn theo (không sticky)
- Loading state với spinner đẹp
- Pagination ở cuối trang
- Footer layout chuẩn

---

## ✅ Testing Checklist

- [ ] API endpoint hoạt động: `curl http://localhost:8080/api/vehicles?page=0&size=10`
- [ ] Backend trả đúng format JSON
- [ ] Frontend hiển thị danh sách xe
- [ ] Pagination chuyển trang được
- [ ] Search hoạt động
- [ ] Filter theo giá hoạt động
- [ ] Sorting hoạt động
- [ ] Loading state hiển thị
- [ ] Empty state hiển thị khi không có data
- [ ] Error handling khi backend lỗi

---

## 🐛 Nếu có lỗi

1. **Kiểm tra backend có chạy không:**
   ```bash
   curl http://localhost:8080/api/vehicles?page=0&size=10
   ```

2. **Kiểm tra CORS:**
   - Backend phải cho phép `http://localhost:5173`
   - Spring Boot: Add CORS config

3. **Kiểm tra response format:**
   - Mở DevTools → Network tab
   - Xem response của `/api/vehicles`
   - Format phải match với `VehicleApiResponse` type

4. **Kiểm tra console:**
   - Có log `🌐 Fetching from API`?
   - Có log `✅ API Response`?
   - Có log `❌ API Error`?

---

## 🎉 Kết luận

✅ **100% Real API** - Không còn mock data
✅ **Tối ưu** - Code sạch, dễ maintain
✅ **Error handling** - Bắt lỗi đầy đủ
✅ **Flexible** - Hỗ trợ nhiều response format
✅ **Responsive** - Container đẹp mọi màn hình

**Mock data đã được XOÁ hoàn toàn!** 🎊
