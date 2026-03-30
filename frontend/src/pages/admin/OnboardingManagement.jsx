import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  Search, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Building2,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL;

const OnboardingManagement = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, setup_complete: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [statusFilter]);
  
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await fetch(`${API}/api/onboarding/submissions${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      toast.error('Failed to load submissions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/onboarding/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    return (
      sub.business_name?.toLowerCase().includes(query) ||
      sub.name?.toLowerCase().includes(query) ||
      sub.email?.toLowerCase().includes(query) ||
      sub.industry?.toLowerCase().includes(query)
    );
  });
  
  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'warning', icon: Clock },
      reviewed: { variant: 'info', icon: Eye },
      setup_complete: { variant: 'success', icon: CheckCircle2 },
      rejected: { variant: 'destructive', icon: XCircle }
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6" data-testid="admin-onboarding-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Client Onboarding</h1>
            <p className="text-muted-foreground">Review and manage new client submissions</p>
          </div>
          <Button onClick={() => { fetchSubmissions(); fetchStats(); }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.reviewed}</p>
                  <p className="text-xs text-muted-foreground">Reviewed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.setup_complete}</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="onboarding-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="setup_complete">Setup Complete</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Submissions ({filteredSubmissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Business</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Industry</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Voice</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submitted</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr 
                        key={submission.submission_id} 
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{submission.business_name}</p>
                            <p className="text-xs text-muted-foreground">{submission.business_size}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm">{submission.name}</p>
                            <p className="text-xs text-muted-foreground">{submission.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm capitalize">{submission.industry}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{submission.selected_voice_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(submission.status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(submission.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin/onboarding/${submission.submission_id}`)}
                            data-testid={`view-submission-${submission.submission_id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OnboardingManagement;
