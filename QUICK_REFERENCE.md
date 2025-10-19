# 📱 Quick Reference - Responsive Container System

## 🎯 Container Classes

```html
<!-- Standard responsive container -->
<div class="container">
  <!-- Max-width: 540px → 720px → 960px → 1140px → 1320px → 1520px -->
</div>

<!-- Full-width container -->
<div class="container-fluid">
  <!-- Always 100% width with responsive padding -->
</div>

<!-- Container without padding -->
<div class="container-no-padding">
  <!-- No horizontal padding -->
</div>
```

---

## 📐 Grid System

```html
<!-- Basic grid -->
<div class="row">
  <div class="col-12 col-md-6 col-lg-4">
    <!-- Mobile: 100%, Tablet: 50%, Desktop: 33.33% -->
  </div>
</div>

<!-- With alignment -->
<div class="row align-items-center justify-content-between">
  <div class="col-auto">Left</div>
  <div class="col-auto">Right</div>
</div>
```

---

## 🎨 Utility Classes

### Display
```html
<div class="d-none d-md-block">Show on tablet+</div>
<div class="d-block d-lg-none">Show on mobile/tablet only</div>
```

### Spacing (0-8 scale)
```html
<div class="mt-4 mb-5 px-3 py-2">
  <!-- margin-top: 2rem, margin-bottom: 2.5rem -->
  <!-- padding-x: 1.5rem, padding-y: 1rem -->
</div>

<!-- Responsive spacing -->
<div class="mt-2 mt-md-4 mt-lg-6">
  <!-- Mobile: 1rem, Tablet: 2rem, Desktop: 3rem -->
</div>
```

### Text Alignment
```html
<div class="text-center text-md-left">
  <!-- Center on mobile, left on tablet+ -->
</div>
```

### Flexbox
```html
<div class="d-flex justify-center align-center gap-3">
  <!-- Centered flex with 1.5rem gap -->
</div>
```

---

## 📏 Breakpoints

| Name | Size | Usage |
|------|------|-------|
| xs | 0px | `@include respond-to('xs')` |
| sm | 576px | `@include respond-to('sm')` |
| md | 768px | `@include respond-to('md')` |
| lg | 992px | `@include respond-to('lg')` |
| xl | 1200px | `@include respond-to('xl')` |
| xxl | 1400px | `@include respond-to('xxl')` |
| xxxl | 1600px | `@include respond-to('xxxl')` |

---

## 🔧 SCSS Mixins

```scss
// Responsive styles
.my-component {
  @include respond-to('md') {
    // Styles for tablet and up
  }
  
  @include respond-to-max('md') {
    // Styles for below tablet
  }
  
  @include respond-between('md', 'lg') {
    // Styles for tablet only
  }
}
```

---

## 🎯 Fixed Navbar Spacing

```scss
// For pages with fixed navbar
.my-page {
  min-height: calc(100vh - 10rem); // Account for navbar
}

// For sticky elements
.my-sticky {
  position: sticky;
  top: 12rem; // navbar (10rem) + spacing (2rem)
}
```

---

## 💡 Common Patterns

### Hero Section
```html
<section class="hero-section">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-12 col-lg-6">
        <h1>Heading</h1>
      </div>
      <div class="col-12 col-lg-6">
        <img src="image.jpg" class="w-100" />
      </div>
    </div>
  </div>
</section>
```

### Card Grid
```html
<div class="container py-5">
  <div class="row">
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
      <div class="card">Card</div>
    </div>
    <!-- Repeat... -->
  </div>
</div>
```

### Centered Content
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

## 📝 Spacing Scale

| Class | Value | Pixels (base 10px) |
|-------|-------|--------------------|
| `*-0` | 0 | 0px |
| `*-1` | 0.5rem | 5px |
| `*-2` | 1rem | 10px |
| `*-3` | 1.5rem | 15px |
| `*-4` | 2rem | 20px |
| `*-5` | 2.5rem | 25px |
| `*-6` | 3rem | 30px |
| `*-7` | 4rem | 40px |
| `*-8` | 5rem | 50px |

---

## ✅ Testing Checklist

- [ ] Test on iPhone SE (375px)
- [ ] Test on iPad (768px)  
- [ ] Test on Desktop (1200px)
- [ ] No horizontal scroll
- [ ] Images responsive
- [ ] Navbar doesn't overlap
- [ ] Touch targets ≥ 44x44px

---

**📚 Xem thêm:** `RESPONSIVE_GUIDE.md` và `NAVBAR_FIX_GUIDE.md`