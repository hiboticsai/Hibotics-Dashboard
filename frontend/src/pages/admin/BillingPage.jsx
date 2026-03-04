import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KPICard from '../../components/dashboard/KPICard';
import { DataTable, StatusBadge, formatCurrency } from '../../components/dashboard/DataTable';
import { billingApi, companiesApi } from '../../lib/api';
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
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';
import { Search, Filter, DollarSign, CheckCircle, AlertCircle, Clock, Edit } from 'lucide-react';

const BillingPage = () => {
  const [billing, setBilling] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    payment_status: 'pending'
  });

  const fetchData = async () => {
    try {
      const params = statusFilter !== 'all' ? { paymentStatus: statusFilter } : {};
      const [billingData, companiesData] = await Promise.all([
        billingApi.list(params),
        companiesApi.list()
      ]);
      setBilling(billingData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenEdit = (record) => {
    setEditingBilling(record);
    setFormData({
      payment_status: record.payment_status || 'pending'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBilling(null);
  };

  const handleUpdate = async () => {
    try {
      await billingApi.update(editingBilling.billing_id, formData);
      toast.success('Billing record updated');
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error('Failed to update billing');
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.company_id === companyId);
    return company?.company_name || '-';
  };

  // Calculate totals
  const totalRevenue = billing.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_cost, 0);
  const pendingAmount = billing.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + b.total_cost, 0);
  const overdueAmount = billing.filter(b => b.payment_status === 'overdue').reduce((sum, b) => sum + b.total_cost, 0);

  const filteredBilling = billing.filter(record => {
    const companyName = getCompanyName(record.company_id);
    return companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.month?.includes(searchQuery);
  });

  const columns = [
    { key: 'company_id', label: 'Company', render: (val) => (
      <span className="font-medium">{getCompanyName(val)}</span>
    )},
    { key: 'month', label: 'Month', render: (val) => (
      <span className="text-sm">{val}</span>
    )},
    { key: 'retainer_amount', label: 'Retainer', render: (val) => (
      <span className="text-sm">{formatCurrency(val)}</span>
    )},
    { key: 'minutes_used', label: 'Minutes', render: (val) => (
      <span className="text-sm">{val}</span>
    )},
    { key: 'usage_cost', label: 'Usage', render: (val) => (
      <span className="text-sm">{formatCurrency(val)}</span>
    )},
    { key: 'total_cost', label: 'Total', render: (val) => (
      <span className="font-medium">{formatCurrency(val)}</span>
    )},
    { key: 'payment_status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: '', render: (_, row) => (
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
        data-testid={`edit-billing-${row.billing_id}`}
      >
        <Edit className="h-4 w-4" />
      </Button>
    )}
  ];

  return (
    <DashboardLayout 
      isAdmin={true}
      pageTitle="Billing" 
      pageSubtitle="Track payments and revenue"
    >
      <div className="space-y-6" data-testid="billing-page">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Revenue"
            value={totalRevenue}
            format="currency"
            icon={CheckCircle}
            change={12}
            changeType="up"
          />
          <KPICard
            title="Pending Payments"
            value={pendingAmount}
            format="currency"
            icon={Clock}
          />
          <KPICard
            title="Overdue Amount"
            value={overdueAmount}
            format="currency"
            icon={AlertCircle}
          />
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company or month..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-billing-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Billing Table */}
        <DataTable
          title={`Billing Records (${filteredBilling.length})`}
          columns={columns}
          data={filteredBilling}
          loading={loading}
          onRowClick={handleOpenEdit}
          emptyMessage="No billing records found"
        />

        {/* Edit Billing Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
              <DialogDescription>
                {editingBilling && (
                  <span>
                    {getCompanyName(editingBilling.company_id)} - {editingBilling.month}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {editingBilling && (
              <div className="space-y-4 py-4">
                {/* Billing Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retainer</span>
                    <span>{formatCurrency(editingBilling.retainer_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minutes Used</span>
                    <span>{editingBilling.minutes_used}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage Cost</span>
                    <span>{formatCurrency(editingBilling.usage_cost)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(editingBilling.total_cost)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select 
                    value={formData.payment_status} 
                    onValueChange={(val) => setFormData({ ...formData, payment_status: val })}
                  >
                    <SelectTrigger data-testid="billing-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Paid
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="overdue">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Overdue
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} className="btn-primary" data-testid="update-billing-btn">
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;
