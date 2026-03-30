import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const HIBOTICS_LOGO_DARK = 'https://customer-assets.emergentagent.com/job_hibotics-analytics/artifacts/r3t3k0rb_hibotics_ai_logo_transparent%20%282%29.png';
const HIBOTICS_LOGO_LIGHT = 'https://customer-assets.emergentagent.com/job_hibotics-analytics/artifacts/b0jkqs3r_hibotics_ai_logo_light_bg%20%281%29.png';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, defaultTheme = 'dark' }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hibotics-theme');
      return stored || defaultTheme;
    }
    return defaultTheme;
  });

  // White-label branding state
  const [branding, setBranding] = useState({
    brandName: 'HiBotics AI',
    brandLogoUrlDark: HIBOTICS_LOGO_DARK,
    brandLogoUrlLight: HIBOTICS_LOGO_LIGHT,
    primaryColor: '#00F5D4',
    accentColor: '#00F5D4',
    showPoweredBy: true
  });

  // Compute the current logo based on theme
  const currentLogo = theme === 'dark' ? branding.brandLogoUrlDark : branding.brandLogoUrlLight;

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('hibotics-theme', theme);
  }, [theme]);

  // Apply branding colors as CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    if (branding.primaryColor) {
      // Convert hex to HSL for CSS variable
      const primaryHsl = hexToHsl(branding.primaryColor);
      root.style.setProperty('--custom-primary', primaryHsl);
    }
    
    if (branding.accentColor) {
      const accentHsl = hexToHsl(branding.accentColor);
      root.style.setProperty('--custom-accent', accentHsl);
    }
  }, [branding]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const applyBranding = (newBranding) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    branding: {
      ...branding,
      brandLogoUrl: currentLogo
    },
    applyBranding
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Helper function to convert hex to HSL string
function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default ThemeContext;
