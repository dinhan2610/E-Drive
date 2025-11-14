// Map tên màu tiếng Việt sang mã hex với gradient cho màu metallic
export const COLOR_MAP: Record<string, { solid: string; gradient?: string }> = {
  // Màu cơ bản VinFast
  'Trắng': { 
    solid: '#FFFFFF',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)'
  },
  'Đen': { 
    solid: '#000000',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)'
  },
  'Xám': { 
    solid: '#808080',
    gradient: 'linear-gradient(135deg, #a0a0a0 0%, #707070 100%)'
  },
  'Bạc': { 
    solid: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8 0%, #B8B8B8 50%, #C8C8C8 100%)'
  },
  'Đỏ': { 
    solid: '#DC143C',
    gradient: 'linear-gradient(135deg, #FF4444 0%, #CC0000 100%)'
  },
  'Xanh': { 
    solid: '#1E90FF',
    gradient: 'linear-gradient(135deg, #4A9EFF 0%, #0066CC 100%)'
  },
  'Xanh lá': { 
    solid: '#228B22',
    gradient: 'linear-gradient(135deg, #32CD32 0%, #006400 100%)'
  },
  'Vàng': { 
    solid: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFE44D 0%, #FFC700 100%)'
  },
  'Cam': { 
    solid: '#FF8C00',
    gradient: 'linear-gradient(135deg, #FFA500 0%, #FF6600 100%)'
  },
  'Nâu': { 
    solid: '#8B4513',
    gradient: 'linear-gradient(135deg, #A0522D 0%, #654321 100%)'
  },
  'Hồng': { 
    solid: '#FF69B4',
    gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FF1493 100%)'
  },
  'Tím': { 
    solid: '#9370DB',
    gradient: 'linear-gradient(135deg, #B19CD9 0%, #6A5ACD 100%)'
  },
  
  // Màu đặc biệt VinFast (theo catalog chính thức)
  'Brahminy White': { 
    solid: '#FAFAFA',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F0F0 100%)'
  },
  'Pearl White': { 
    solid: '#F8F8F8',
    gradient: 'linear-gradient(135deg, #FFFFFF 10%, #EFEFEF 90%)'
  },
  'Stellar Black': { 
    solid: '#0D0D0D',
    gradient: 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)'
  },
  'Moonlight Silver': { 
    solid: '#C4C4C4',
    gradient: 'linear-gradient(135deg, #E0E0E0 0%, #BFBFBF 50%, #D0D0D0 100%)'
  },
  'Storm Blue': { 
    solid: '#2C5F8D',
    gradient: 'linear-gradient(135deg, #4682B4 0%, #1C4966 100%)'
  },
  'Ocean Blue': { 
    solid: '#003D82',
    gradient: 'linear-gradient(135deg, #1E5A9E 0%, #002D5C 100%)'
  },
  'Crimson Red': { 
    solid: '#B8001F',
    gradient: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)'
  },
  'Ruby Red': { 
    solid: '#E0115F',
    gradient: 'linear-gradient(135deg, #FF1744 0%, #C51162 100%)'
  },
  'Emerald Green': { 
    solid: '#50C878',
    gradient: 'linear-gradient(135deg, #66D98A 0%, #3AAA5C 100%)'
  },
  'Forest Green': { 
    solid: '#228B22',
    gradient: 'linear-gradient(135deg, #32CD32 0%, #1A6B1A 100%)'
  },
  'Sunset Orange': { 
    solid: '#FF6347',
    gradient: 'linear-gradient(135deg, #FF7A5C 0%, #E5533D 100%)'
  },
  'Metallic Gray': { 
    solid: '#71797E',
    gradient: 'linear-gradient(135deg, #8A9299 0%, #5E666B 50%, #71797E 100%)'
  },
  'Titanium Gray': { 
    solid: '#6F7378',
    gradient: 'linear-gradient(135deg, #888C91 0%, #5A5E62 50%, #6F7378 100%)'
  },
  
  // Thêm các biến thể khác
  'Xanh dương': { 
    solid: '#0066CC',
    gradient: 'linear-gradient(135deg, #1E7FCC 0%, #004D99 100%)'
  },
  'Xanh lam': { 
    solid: '#1E90FF',
    gradient: 'linear-gradient(135deg, #4A9EFF 0%, #0066CC 100%)'
  },
  'Xanh Lam': { 
    solid: '#1E90FF',
    gradient: 'linear-gradient(135deg, #4A9EFF 0%, #0066CC 100%)'
  },
  'Xanh navy': { 
    solid: '#000080',
    gradient: 'linear-gradient(135deg, #1A1AAD 0%, #000060 100%)'
  },
  
  // Default
  'default': { 
    solid: '#CCCCCC',
    gradient: 'linear-gradient(135deg, #DDDDDD 0%, #BBBBBB 100%)'
  },
};

/**
 * Lấy mã hex và gradient của màu
 */
export function getColorStyle(colorName: string): { solid: string; gradient: string } {
  const normalizedColor = colorName.trim();
  const colorData = COLOR_MAP[normalizedColor] || COLOR_MAP['default'];
  
  return {
    solid: colorData.solid,
    gradient: colorData.gradient || colorData.solid
  };
}

/**
 * Lấy mã hex của màu (backward compatibility)
 */
export function getColorHex(colorName: string): string {
  return getColorStyle(colorName).solid;
}

/**
 * Kiểm tra màu sáng hay tối (để chọn text color phù hợp)
 */
export function isLightColor(hex: string): boolean {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 180;
}

/**
 * Tạo border color phù hợp với màu xe
 */
export function getBorderColor(hex: string): string {
  if (isLightColor(hex)) {
    return '#D1D5DB'; // Gray-300 cho màu sáng
  }
  return 'rgba(255, 255, 255, 0.2)'; // White semi-transparent cho màu tối
}
