# 📱 Responsive Container & Grid System Documentation

## 🎯 Tổng quan
Hệ thống responsive container và grid được thiết kế để tối ưu cho tất cả kích thước màn hình từ mobile đến desktop.

---

## 📐 Breakpoints

| Breakpoint | Kích thước | Loại thiết bị |
|------------|------------|---------------|
| `xs` | 0px | Extra small (điện thoại dọc) |
| `sm` | 576px | Small (điện thoại ngang) |
| `md` | 768px | Medium (tablet) |
| `lg` | 992px | Large (desktop) |
| `xl` | 1200px | Extra large (desktop lớn) |
| `xxl` | 1400px | Extra extra large |
| `xxxl` | 1600px | Ultra wide screens |

---

## 📦 Container Classes

### 1. `.container` - Container responsive tiêu chuẩn
```html
<div class="container">
  <!-- Nội dung của bạn -->
</div>
```

**Max-width tại mỗi breakpoint:**
- xs: 100% (padding: 1.5rem)
- sm: 540px (padding: 2rem)
- md: 720px (padding: 2.5rem)
- lg: 960px (padding: 3rem)
- xl: 1140px
- xxl: 1320px
- xxxl: 1520px

### 2. `.container-fluid` - Container full width
```html
<div class="container-fluid">
  <!-- Luôn 100% width với responsive padding -->
</div>
```

### 3. `.container-no-padding` - Container không padding ngang
```html
<div class="container-no-padding">
  <!-- Không có padding left/right -->
</div>
```

---

## 🎨 Grid System

### Cách sử dụng Grid cơ bản

```html
<!-- Row với 3 cột bằng nhau -->
<div class="row">
  <div class="col">Column 1</div>
  <div class="col">Column 2</div>
  <div class="col">Column 3</div>
</div>

<!-- Row với cột có kích thước cố định (tổng 12) -->
<div class="row">
  <div class="col-4">33.33% width</div>
  <div class="col-8">66.67% width</div>
</div>

<!-- Responsive columns -->
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Mobile: 100% width -->
    <!-- Tablet: 50% width -->
    <!-- Desktop: 33.33% width -->
  </div>
</div>
```

### Grid với No Gutters
```html
<div class="row no-gutters">
  <div class="col">Không có khoảng cách</div>
  <div class="col">giữa các cột</div>
</div>
```

### Alignment trong Grid
```html
<!-- Vertical alignment -->
<div class="row align-items-center">
  <div class="col">Căn giữa theo chiều dọc</div>
</div>

<!-- Horizontal alignment -->
<div class="row justify-content-between">
  <div class="col-4">Left</div>
  <div class="col-4">Right</div>
</div>
```

---

## 🛠️ Utility Classes

### Display Utilities
```html
<!-- Ẩn/hiện theo breakpoint -->
<div class="d-none d-md-block">Chỉ hiện trên tablet+</div>
<div class="d-block d-lg-none">Chỉ hiện trên mobile/tablet</div>
```

### Text Alignment
```html
<div class="text-center text-md-left">
  <!-- Center trên mobile, left trên tablet+ -->
</div>
```

### Spacing (Margin & Padding)
```html
<!-- Margin -->
<div class="m-3">margin: 1.5rem</div>
<div class="mt-4">margin-top: 2rem</div>
<div class="mx-auto">margin-left & right: auto (center)</div>
<div class="my-5">margin-top & bottom: 2.5rem</div>

<!-- Padding -->
<div class="p-4">padding: 2rem</div>
<div class="px-3">padding-left & right: 1.5rem</div>
<div class="py-2">padding-top & bottom: 1rem</div>

<!-- Responsive spacing -->
<div class="mt-2 mt-md-4 mt-lg-6">
  <!-- Mobile: 1rem, Tablet: 2rem, Desktop: 3rem -->
</div>
```

**Spacing values:**
- `0`: 0
- `1`: 0.5rem (5px)
- `2`: 1rem (10px)
- `3`: 1.5rem (15px)
- `4`: 2rem (20px)
- `5`: 2.5rem (25px)
- `6`: 3rem (30px)
- `7`: 4rem (40px)
- `8`: 5rem (50px)
- `auto`: auto

### Flexbox Utilities
```html
<div class="d-flex justify-center align-center">
  <!-- Căn giữa theo cả 2 chiều -->
</div>

<div class="d-flex flex-column gap-3">
  <!-- Flex column với gap 1.5rem -->
</div>
```

### Width & Height
```html
<div class="w-100">width: 100%</div>
<div class="w-50">width: 50%</div>
<div class="h-100">height: 100%</div>
```

---

## 💡 Ví dụ thực tế

### 1. Hero Section Responsive
```html
<section class="hero">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-12 col-lg-6">
        <h1 class="text-center text-lg-left">Heading</h1>
        <p class="text-center text-lg-left">Description</p>
      </div>
      <div class="col-12 col-lg-6">
        <img src="image.jpg" class="w-100" alt="Hero">
      </div>
    </div>
  </div>
</section>
```

### 2. Card Grid
```html
<div class="container py-5">
  <div class="row">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
      <div class="card">Card 1</div>
    </div>
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
      <div class="card">Card 2</div>
    </div>
    <!-- Thêm cards... -->
  </div>
</div>
```

### 3. Responsive Navbar
```html
<nav class="navbar">
  <div class="container-fluid">
    <div class="d-flex justify-between align-center w-100">
      <div class="logo">Logo</div>
      <div class="d-none d-lg-flex gap-4">
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
      </div>
      <button class="d-lg-none">☰</button>
    </div>
  </div>
</nav>
```

---

## 📝 Best Practices

1. **Luôn sử dụng container** cho content chính
2. **Mobile-first approach**: Thiết kế cho mobile trước, sau đó mở rộng cho desktop
3. **Sử dụng grid system** thay vì fixed width
4. **Test trên nhiều kích thước**: xs, sm, md, lg, xl, xxl
5. **Tận dụng utility classes** để giảm CSS custom
6. **Responsive images**: Luôn dùng `class="w-100"` hoặc `max-width: 100%`
7. **Consistent spacing**: Dùng spacing utilities thay vì margin/padding trực tiếp

---

## 🎨 Responsive Typography

```scss
// Trong SCSS, bạn có thể sử dụng mixins
@use "./breakpoints" as *;

.my-heading {
  font-size: 2.4rem;
  
  @include respond-to('md') {
    font-size: 3.2rem;
  }
  
  @include respond-to('lg') {
    font-size: 4rem;
  }
}
```

---

## 🚀 Tips & Tricks

### 1. Stack on Mobile, Side by Side on Desktop
```html
<div class="row">
  <div class="col-12 col-md-6">Left</div>
  <div class="col-12 col-md-6">Right</div>
</div>
```

### 2. Hide/Show Elements
```html
<!-- Chỉ hiện trên desktop -->
<div class="d-none d-lg-block">Desktop only</div>

<!-- Chỉ hiện trên mobile -->
<div class="d-block d-lg-none">Mobile only</div>
```

### 3. Responsive Padding
```html
<section class="py-3 py-md-5 py-lg-7">
  <!-- Mobile: 1.5rem, Tablet: 2.5rem, Desktop: 4rem -->
</section>
```

### 4. Center Content
```html
<div class="container">
  <div class="row">
    <div class="col-12 col-md-8 col-lg-6 mx-auto">
      <!-- Centered content -->
    </div>
  </div>
</div>
```

---

## 🔧 Custom Breakpoints trong SCSS

```scss
@use "./breakpoints" as *;

.my-component {
  // Mobile styles
  padding: 1rem;
  
  // Tablet and up
  @include respond-to('md') {
    padding: 2rem;
  }
  
  // Desktop and up
  @include respond-to('lg') {
    padding: 3rem;
  }
  
  // Only mobile (max-width)
  @include respond-to-max('md') {
    font-size: 1.4rem;
  }
  
  // Between breakpoints
  @include respond-between('md', 'lg') {
    background: lightgray;
  }
}
```

---

## ✅ Checklist Testing

- [ ] Test trên iPhone SE (375px)
- [ ] Test trên iPad (768px)
- [ ] Test trên Desktop (1200px)
- [ ] Test trên Ultra Wide (1920px+)
- [ ] Kiểm tra horizontal scroll
- [ ] Kiểm tra images responsive
- [ ] Kiểm tra typography scale
- [ ] Kiểm tra spacing consistency
- [ ] Kiểm tra navigation mobile/desktop
- [ ] Kiểm tra touch targets (min 44x44px)

---

## 🎯 Kết luận

Hệ thống này cung cấp:
- ✅ Container responsive tối ưu
- ✅ Grid system linh hoạt 12-column
- ✅ Utility classes đầy đủ
- ✅ Mobile-first approach
- ✅ Easy to customize
- ✅ Consistent spacing
- ✅ Cross-browser compatible

**Hãy sử dụng và tùy chỉnh theo nhu cầu dự án của bạn! 🚀**