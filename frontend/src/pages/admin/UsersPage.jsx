import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable, StatusBadge, formatDate } from '../../components/dashboard/DataTable';
import { usersApi, companiesApi } from '../../lib/api';
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
import { Search, Plus, Trash2, User, Shield } from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    company_id: ''
  });

  const fetchData = async () => {
    try {
      const [usersData, companiesData] = await Promise.all([
        usersApi.list(),
        companiesApi.list()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'client',
      company_id: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCreate = async () => {
    try {
      await usersApi.create(formData);
      toast.success('User created successfully');
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersApi.delete(userId);
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.company_id === companyId);
    return company?.company_name || '-';
  };

  const columns = [
    { key: 'name', label: 'User', render: (val, row) => (
      <div className="flex items-center gap-3">
        {row.picture ? (
          <img src={row.picture} alt={val} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <p className="font-medium">{val}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (val) => (
      <div className="flex items-center gap-2">
        {val === 'admin' && <Shield className="h-4 w-4 text-primary" />}
        <StatusBadge status={val} />
      </div>
    )},
    { key: 'company_id', label: 'Company', render: (val) => (
      <span className="text-sm">{getCompanyName(val)}</span>
    )},
    { key: 'actions', label: '', render: (_, row) => (
      <Button 
        variant="ghost" 
        size="icon"
        onClick={(e) => { e.stopPropagation(); handleDelete(row.user_id); }}
        data-testid={`delete-user-${row.user_id}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    )}
  ];

  return (
    <DashboardLayout 
      isAdmin={true}
      pageTitle="Users" 
      pageSubtitle="Manage user accounts"
    >
      <div className="space-y-6" data-testid="users-page">
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-users-input"
                />
              </div>
              <Button onClick={handleOpenCreate} className="btn-primary" data-testid="create-user-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <DataTable
          title={`Users (${filteredUsers.length})`}
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users found"
        />

        {/* Create User Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Add a new user account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="user-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="user-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="user-password-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.role === 'client' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Assign to Company</Label>
                  <Select 
                    value={formData.company_id} 
                    onValueChange={(val) => setFormData({ ...formData, company_id: val })}
                  >
                    <SelectTrigger data-testid="user-company-select">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No company</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.company_id} value={company.company_id}>
                          {company.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleCreate} className="btn-primary" data-testid="save-user-btn">
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UsersPage;
