import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable, StatusBadge, formatDate } from '../../components/dashboard/DataTable';
import { useTenant } from '../../contexts/TenantContext';
import { leadsApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
import { Card, CardContent } from '../../components/ui/card';
import { Search, Filter, Plus, Edit, Trash2, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

const LeadsPage = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service_requested: '',
    status: 'new',
    notes: ''
  });

  const fetchLeads = async () => {
    if (!company?.company_id) return;
    
    try {
      const params = { companyId: company.company_id };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const data = await leadsApi.list(params);
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [company?.company_id, statusFilter]);

  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      service_requested: lead.service_requested || '',
      status: lead.status || 'new',
      notes: lead.notes || ''
    });
    setEditMode(true);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    setEditMode(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      service_requested: '',
      status: 'new',
      notes: ''
    });
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    
    try {
      await leadsApi.update(selectedLead.lead_id, formData);
      toast.success('Lead updated successfully');
      handleCloseModal();
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      await leadsApi.delete(leadId);
      toast.success('Lead deleted');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadColumns = [
    { key: 'name', label: 'Name', render: (val, row) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{val}</p>
          <p className="text-xs text-muted-foreground">{row.email || 'No email'}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (val) => (
      <span className="text-sm">{val}</span>
    )},
    { key: 'service_requested', label: 'Service', render: (val) => (
      <span className="text-sm text-muted-foreground">{val || '-'}</span>
    )},
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'created_at', label: 'Created', render: (val) => (
      <span className="text-sm text-muted-foreground">{formatDate(val)}</span>
    )},
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
          data-testid={`edit-lead-${row.lead_id}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleDeleteLead(row.lead_id); }}
          data-testid={`delete-lead-${row.lead_id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )}
  ];

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Leads CRM" 
      pageSubtitle="Manage and track your leads"
    >
      <div className="space-y-6" data-testid="leads-page">
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-leads-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <DataTable
          title={`Leads (${filteredLeads.length})`}
          columns={leadColumns}
          data={filteredLeads}
          loading={loading}
          onRowClick={handleOpenEdit}
          emptyMessage="No leads found"
        />

        {/* Edit Lead Modal */}
        <Dialog open={editMode} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>
                Update lead information and status
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="edit-lead-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="edit-lead-phone"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="edit-lead-email"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service Requested</Label>
                  <Input
                    id="service"
                    value={formData.service_requested}
                    onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
                    data-testid="edit-lead-service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger data-testid="edit-lead-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="edit-lead-notes"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLead} className="btn-primary" data-testid="save-lead-btn">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default LeadsPage;
