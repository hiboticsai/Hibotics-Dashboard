import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTheme } from './ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TenantContext = createContext(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

const HIBOTICS_LOGO_DARK = 'https://customer-assets.emergentagent.com/job_hibotics-analytics/artifacts/r3t3k0rb_hibotics_ai_logo_transparent%20%282%29.png';
const HIBOTICS_LOGO_LIGHT = 'https://customer-assets.emergentagent.com/job_hibotics-analytics/artifacts/b0jkqs3r_hibotics_ai_logo_light_bg%20%281%29.png';

export const TenantProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { applyBranding } = useTheme();

  const loadCompanyBySlug = useCallback(async (slug) => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API}/companies/slug/${slug}`);
      
      if (!response.ok) {
        throw new Error('Company not found');
      }
      
      const companyData = await response.json();
      setCompany(companyData);
      
      // Apply white-label branding
      applyBranding({
        brandName: companyData.brand_name || companyData.company_name,
        brandLogoUrlDark: companyData.brand_logo_url || HIBOTICS_LOGO_DARK,
        brandLogoUrlLight: companyData.brand_logo_url || HIBOTICS_LOGO_LIGHT,
        primaryColor: companyData.primary_color || '#00F5D4',
        accentColor: companyData.accent_color || '#00F5D4',
        showPoweredBy: companyData.show_powered_by ?? true
      });
      
      return companyData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyBranding]);

  const loadCompanyById = useCallback(async (companyId) => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/companies/${companyId}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Company not found');
      }
      
      const companyData = await response.json();
      setCompany(companyData);
      
      // Apply white-label branding
      applyBranding({
        brandName: companyData.brand_name || companyData.company_name,
        brandLogoUrlDark: companyData.brand_logo_url || HIBOTICS_LOGO_DARK,
        brandLogoUrlLight: companyData.brand_logo_url || HIBOTICS_LOGO_LIGHT,
        primaryColor: companyData.primary_color || '#00F5D4',
        accentColor: companyData.accent_color || '#00F5D4',
        showPoweredBy: companyData.show_powered_by ?? true
      });
      
      return companyData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyBranding]);

  const clearTenant = useCallback(() => {
    setCompany(null);
    // Reset to default branding
    applyBranding({
      brandName: 'HiBotics AI',
      brandLogoUrlDark: HIBOTICS_LOGO_DARK,
      brandLogoUrlLight: HIBOTICS_LOGO_LIGHT,
      primaryColor: '#00F5D4',
      accentColor: '#00F5D4',
      showPoweredBy: true
    });
  }, [applyBranding]);

  const value = {
    company,
    loading,
    error,
    loadCompanyBySlug,
    loadCompanyById,
    clearTenant,
    companyId: company?.company_id
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantContext;
