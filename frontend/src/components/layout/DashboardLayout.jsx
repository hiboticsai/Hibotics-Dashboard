import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children, portalSlug, isAdmin = false, pageTitle, pageSubtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout" data-testid="dashboard-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar portalSlug={portalSlug} isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <main className="main-content flex flex-col" data-testid="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={pageTitle}
          subtitle={pageSubtitle}
        />
        
        <div className="flex-1 p-6 lg:p-8 overflow-auto custom-scrollbar animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
