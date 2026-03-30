import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  Share2, 
  FileText, 
  Settings,
  Building2,
  CreditCard,
  Bot,
  LogOut,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const Sidebar = ({ portalSlug, isAdmin = false }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, branding } = useTheme();
  const location = useLocation();

  const clientNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `/portal/${portalSlug}` },
    { icon: Phone, label: 'Call Log', path: `/portal/${portalSlug}/calls` },
    { icon: Users, label: 'Leads CRM', path: `/portal/${portalSlug}/leads` },
    { icon: Share2, label: 'Social Insights', path: `/portal/${portalSlug}/social` },
    { icon: FileText, label: 'Reports', path: `/portal/${portalSlug}/reports` },
    { icon: Settings, label: 'Settings', path: `/portal/${portalSlug}/settings` },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Bot, label: 'Agents', path: '/admin/agents' },
    { icon: CreditCard, label: 'Billing', path: '/admin/billing' },
  ];

  const navItems = isAdmin ? adminNavItems : clientNavItems;

  const isActivePath = (path) => {
    if (path === `/portal/${portalSlug}` || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar flex flex-col h-full" data-testid="sidebar">
      {/* Logo Section */}
      <div className="logo-container">
        <img 
          src={branding.brandLogoUrl} 
          alt={branding.brandName}
          className="h-8 w-auto"
          data-testid="brand-logo"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <div className="nav-section">
          <div className="nav-section-title">
            {isAdmin ? 'Admin Panel' : 'Navigation'}
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link group ${isActivePath(item.path) ? 'sidebar-link-active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActivePath(item.path) ? 'opacity-100' : ''}`} />
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 space-y-4 border-t border-border">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={toggleTheme}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              <span>Dark Mode</span>
            </>
          )}
        </Button>

        <Separator />

        {/* User Info & Logout */}
        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium">{user.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}

        {/* Powered By */}
        {branding.showPoweredBy && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Powered by{' '}
              <a 
                href="https://hiboticsai.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                HiBotics AI
              </a>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
