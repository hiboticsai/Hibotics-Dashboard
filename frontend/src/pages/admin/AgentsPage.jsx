import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable, StatusBadge, formatDate } from '../../components/dashboard/DataTable';
import { agentsApi, companiesApi } from '../../lib/api';
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
import { Search, Plus, Edit, Trash2, Bot, Phone } from 'lucide-react';

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [formData, setFormData] = useState({
    agent_name: '',
    provider: 'hibotics',
    phone_number: '',
    status: 'active',
    company_id: ''
  });

  const fetchData = async () => {
    try {
      const [agentsData, companiesData] = await Promise.all([
        agentsApi.list(),
        companiesApi.list()
      ]);
      setAgents(agentsData);
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
    setEditingAgent(null);
    setFormData({
      agent_name: '',
      provider: 'hibotics',
      phone_number: '',
      status: 'active',
      company_id: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_name: agent.agent_name || '',
      provider: agent.provider || 'hibotics',
      phone_number: agent.phone_number || '',
      status: agent.status || 'active',
      company_id: agent.company_id || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const handleSave = async () => {
    try {
      if (editingAgent) {
        await agentsApi.update(editingAgent.agent_id, formData);
        toast.success('Agent updated successfully');
      } else {
        if (!formData.company_id) {
          toast.error('Please select a company');
          return;
        }
        await agentsApi.create(formData.company_id, formData);
        toast.success('Agent created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to save agent');
    }
  };

  const handleDelete = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await agentsApi.delete(agentId);
      toast.success('Agent deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.company_id === companyId);
    return company?.company_name || '-';
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone_number?.includes(searchQuery);
    const matchesCompany = companyFilter === 'all' || agent.company_id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const columns = [
    { key: 'agent_name', label: 'Agent', render: (val, row) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{val}</p>
          <p className="text-xs text-muted-foreground">{row.provider}</p>
        </div>
      </div>
    )},
    { key: 'phone_number', label: 'Phone', render: (val) => (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span>{val}</span>
      </div>
    )},
    { key: 'company_id', label: 'Company', render: (val) => (
      <span className="text-sm">{getCompanyName(val)}</span>
    )},
    { key: 'status', label: 'Status', render: (val) => (
      <div className="flex items-center gap-2">
        <span className={`status-dot ${val}`} />
        <StatusBadge status={val} />
      </div>
    )},
    { key: 'created_at', label: 'Created', render: (val) => (
      <span className="text-sm text-muted-foreground">{formatDate(val)}</span>
    )},
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
          data-testid={`edit-agent-${row.agent_id}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => { e.stopPropagation(); handleDelete(row.agent_id); }}
          data-testid={`delete-agent-${row.agent_id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    )}
  ];

  return (
    <DashboardLayout 
      isAdmin={true}
      pageTitle="Agents" 
      pageSubtitle="Manage AI voice agents"
    >
      <div className="space-y-6" data-testid="agents-page">
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="search-agents-input"
                  />
                </div>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="company-filter">
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.company_id} value={company.company_id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleOpenCreate} className="btn-primary" data-testid="create-agent-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Agents Table */}
        <DataTable
          title={`Agents (${filteredAgents.length})`}
          columns={columns}
          data={filteredAgents}
          loading={loading}
          onRowClick={handleOpenEdit}
          emptyMessage="No agents found"
        />

        {/* Create/Edit Agent Modal */}
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? 'Edit Agent' : 'Create Agent'}
              </DialogTitle>
              <DialogDescription>
                {editingAgent ? 'Update agent details' : 'Add a new AI voice agent'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="agent_name">Agent Name *</Label>
                <Input
                  id="agent_name"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  placeholder="e.g., Reception AI"
                  data-testid="agent-name-input"
                />
              </div>
              
              {!editingAgent && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Select 
                    value={formData.company_id} 
                    onValueChange={(val) => setFormData({ ...formData, company_id: val })}
                  >
                    <SelectTrigger data-testid="agent-company-select">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.company_id} value={company.company_id}>
                          {company.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1-555-0123"
                  data-testid="agent-phone-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select 
                    value={formData.provider} 
                    onValueChange={(val) => setFormData({ ...formData, provider: val })}
                  >
                    <SelectTrigger data-testid="agent-provider-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hibotics">HiBotics</SelectItem>
                      <SelectItem value="vapi">Vapi</SelectItem>
                      <SelectItem value="bland">Bland AI</SelectItem>
                      <SelectItem value="retell">Retell AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger data-testid="agent-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="btn-primary" data-testid="save-agent-btn">
                {editingAgent ? 'Update Agent' : 'Create Agent'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AgentsPage;
