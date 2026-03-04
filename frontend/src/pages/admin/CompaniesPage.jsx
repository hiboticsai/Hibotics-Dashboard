import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable, formatDate } from '../../components/dashboard/DataTable';
import { companiesApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, ExternalLink, Building2 } from 'lucide-react';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    slug: '',
    contact_name: '',
    email: '',
    phone: '',
    industry: '',
    avg_service_price: 100,
    branding: {
      brand_name: '',
      brand_logo_url: '',
      primary_color: '#4BACC6',
      accent_color: '#FFCC00',
      show_powered_by: true
    }
  });

  const fetchCompanies = async () => {
    try {
      const data = await companiesApi.list();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      company_name: '',
      slug: '',
      contact_name: '',
      email: '',
      phone: '',
      industry: '',
      avg_service_price: 100,
      branding: {
        brand_name: '',
        brand_logo_url: '',
        primary_color: '#4BACC6',
        accent_color: '#FFCC00',
        show_powered_by: true
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name || '',
      slug: company.slug || '',
      contact_name: company.contact_name || '',
      email: company.email || '',
      phone: company.phone || '',
      industry: company.industry || '',
      avg_service_price: company.avg_service_price || 100,
      branding: {
        brand_name: company.brand_name || '',
        brand_logo_url: company.brand_logo_url || '',
        primary_color: company.primary_color || '#4BACC6',
        accent_color: company.accent_color || '#FFCC00',
        show_powered_by: company.show_powered_by ?? true
      }
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompany(null);
  };

  const handleSave = async () => {
    try {
      if (editingCompany) {
        await companiesApi.update(editingCompany.company_id, formData);
        toast.success('Company updated successfully');
      } else {
        await companiesApi.create(formData);
        toast.success('Company created successfully');
      }
      handleCloseModal();
      fetchCompanies();
    } catch (error) {
      toast.error(error.message || 'Failed to save company');
    }
  };

  const handleDelete = async (companyId) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    
    try {
      await companiesApi.delete(companyId);
      toast.success('Company deleted');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'company_name', label: 'Company', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div 
          className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: row.primary_color || '#4BACC6', color: '#000' }}
        >
          {val?.charAt(0)}
        </div>
        <div>
          <p className="font-medium">{val}</p>
          <p className="text-xs text-muted-foreground">/portal/{row.slug}</p>
        </div>
      </div>
    )},
    { key: 'contact_name', label: 'Contact' },
    { key: 'email', label: 'Email', render: (val) => (
      <span className="text-sm text-muted-foreground">{val}</span>
    )},
    { key: 'industry', label: 'Industry', render: (val) => (
      <span className="text-sm capitalize">{val || '-'}</span>
    )},
    { key: 'avg_service_price', label: 'Avg Price', render: (val) => (
      <span className="font-medium">${val}</span>
    )},
    { key: 'created_at', label: 'Created', render: (val) => (
      <span className="text-sm text-muted-foreground">{formatDate(val)}</span>
    )},
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); window.open(`/portal/${row.slug}`, '_blank'); }}
          data-testid={`view-portal-${row.slug}`}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
          data-testid={`edit-company-${row.slug}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleDelete(row.company_id); }}
          data-testid={`delete-company-${row.slug}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )}
  ];

  return (
    <DashboardLayout 
      isAdmin={true}
      pageTitle="Companies" 
      pageSubtitle="Manage client companies and their portals"
    >
      <div className="space-y-6" data-testid="companies-page">
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-companies-input"
                />
              </div>
              <Button onClick={handleOpenCreate} className="btn-primary" data-testid="create-company-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <DataTable
          title={`Companies (${filteredCompanies.length})`}
          columns={columns}
          data={filteredCompanies}
          loading={loading}
          onRowClick={handleOpenEdit}
          emptyMessage="No companies found"
        />

        {/* Create/Edit Company Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Edit Company' : 'Create Company'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany ? 'Update company details and branding' : 'Add a new client company'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      data-testid="company-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Portal Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="company-name"
                      disabled={!!editingCompany}
                      data-testid="company-slug-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      data-testid="company-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="company-phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select 
                      value={formData.industry} 
                      onValueChange={(val) => setFormData({ ...formData, industry: val })}
                    >
                      <SelectTrigger data-testid="industry-select">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="avg_price">Average Service Price ($)</Label>
                    <Input
                      id="avg_price"
                      type="number"
                      value={formData.avg_service_price}
                      onChange={(e) => setFormData({ ...formData, avg_service_price: parseFloat(e.target.value) || 0 })}
                      data-testid="avg-price-input"
                    />
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">White-Label Branding</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand Name</Label>
                    <Input
                      id="brand_name"
                      value={formData.branding.brand_name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        branding: { ...formData.branding, brand_name: e.target.value }
                      })}
                      placeholder="Defaults to company name"
                      data-testid="brand-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand_logo">Logo URL</Label>
                    <Input
                      id="brand_logo"
                      value={formData.branding.brand_logo_url}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        branding: { ...formData.branding, brand_logo_url: e.target.value }
                      })}
                      placeholder="https://..."
                      data-testid="brand-logo-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={formData.branding.primary_color}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, primary_color: e.target.value }
                        })}
                        className="w-16 h-10 p-1"
                        data-testid="primary-color-input"
                      />
                      <Input
                        value={formData.branding.primary_color}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, primary_color: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent_color">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent_color"
                        type="color"
                        value={formData.branding.accent_color}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, accent_color: e.target.value }
                        })}
                        className="w-16 h-10 p-1"
                        data-testid="accent-color-input"
                      />
                      <Input
                        value={formData.branding.accent_color}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          branding: { ...formData.branding, accent_color: e.target.value }
                        })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show "Powered by HiBotics AI"</Label>
                      <p className="text-sm text-muted-foreground">
                        Display branding in the portal footer
                      </p>
                    </div>
                    <Switch
                      checked={formData.branding.show_powered_by}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        branding: { ...formData.branding, show_powered_by: checked }
                      })}
                      data-testid="powered-by-switch"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="btn-primary" data-testid="save-company-btn">
                {editingCompany ? 'Update Company' : 'Create Company'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CompaniesPage;
