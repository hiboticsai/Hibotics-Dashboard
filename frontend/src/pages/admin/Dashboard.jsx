import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KPICard from '../../components/dashboard/KPICard';
import { BarChartWidget, PieChartWidget, LineChartWidget } from '../../components/dashboard/Charts';
import { DataTable, StatusBadge, formatCurrency } from '../../components/dashboard/DataTable';
import { adminApi, companiesApi, seedDatabase } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Bot, 
  Phone, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Database
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, companiesData, performanceData] = await Promise.all([
        adminApi.getStats(),
        companiesApi.list(),
        adminApi.getCompaniesPerformance()
      ]);
      
      setStats(statsData);
      setCompanies(companiesData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const result = await seedDatabase();
      if (result.seeded) {
        toast.success('Database seeded with sample data!');
        fetchData(); // Refresh data
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  const companyColumns = [
    { key: 'company_name', label: 'Company', render: (val, row) => (
      <div>
        <p className="font-medium">{val}</p>
        <p className="text-xs text-muted-foreground">{row.slug}</p>
      </div>
    )},
    { key: 'industry', label: 'Industry', render: (val) => (
      <span className="text-sm capitalize">{val || '-'}</span>
    )},
    { key: 'calls', label: 'Calls' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'leads', label: 'Leads' },
    { key: 'conversion_rate', label: 'Conv. Rate', render: (val) => (
      <span className={val > 30 ? 'text-emerald-400' : val > 15 ? 'text-amber-400' : 'text-muted-foreground'}>
        {val}%
      </span>
    )},
    { key: 'billing_status', label: 'Billing', render: (val) => <StatusBadge status={val} /> }
  ];

  // Prepare chart data
  const billingChartData = [
    { name: 'Paid', value: stats?.total_revenue || 0 },
    { name: 'Pending', value: stats?.pending_amount || 0 },
    { name: 'Overdue', value: stats?.overdue_amount || 0 }
  ];

  return (
    <DashboardLayout 
      isAdmin={true}
      pageTitle="Admin Dashboard" 
      pageSubtitle={`Welcome back, ${user?.name || 'Admin'}`}
    >
      <div className="space-y-8" data-testid="admin-dashboard">
        {/* Seed Database Banner (shown when no data) */}
        {!loading && companies.length === 0 && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Database className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">No Data Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Seed the database with sample companies, calls, and leads to get started.
                  </p>
                </div>
                <Button 
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="btn-primary"
                  data-testid="seed-database-btn"
                >
                  {seeding ? 'Seeding...' : 'Seed Database'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="bento-grid">
          <div className="bento-item-sm">
            <KPICard
              title="Total Companies"
              value={stats?.total_companies || 0}
              icon={Building2}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Total Users"
              value={stats?.total_users || 0}
              icon={Users}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Active Agents"
              value={stats?.total_agents || 0}
              icon={Bot}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Total Calls"
              value={stats?.total_calls || 0}
              icon={Phone}
            />
          </div>
        </div>

        {/* Revenue KPIs */}
        <div className="bento-grid">
          <div className="bento-item-md">
            <KPICard
              title="Total Revenue"
              value={stats?.total_revenue || 0}
              format="currency"
              icon={DollarSign}
              change={12}
              changeType="up"
            />
          </div>
          <div className="bento-item-md">
            <KPICard
              title="Pending Payments"
              value={stats?.pending_amount || 0}
              format="currency"
              icon={AlertCircle}
            />
          </div>
          <div className="bento-item-md">
            <KPICard
              title="Overdue Amount"
              value={stats?.overdue_amount || 0}
              format="currency"
              icon={AlertCircle}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="bento-grid">
          <div className="bento-item-lg">
            <BarChartWidget
              data={performance.slice(0, 5)}
              dataKey="calls"
              xAxisKey="company_name"
              title="Calls by Company"
              color="#4BACC6"
            />
          </div>
          <div className="bento-item-lg">
            <PieChartWidget
              data={billingChartData}
              title="Billing Status"
            />
          </div>
        </div>

        {/* Companies Performance Table */}
        <DataTable
          title="Companies Performance"
          columns={companyColumns}
          data={performance}
          loading={loading}
          emptyMessage="No companies found"
          actions={
            companies.length === 0 && (
              <Button 
                size="sm" 
                onClick={handleSeedDatabase}
                disabled={seeding}
                data-testid="seed-btn-table"
              >
                {seeding ? 'Seeding...' : 'Add Sample Data'}
              </Button>
            )
          }
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card-hover cursor-pointer" onClick={() => window.location.href = '/admin/companies'}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Companies</h3>
                  <p className="text-sm text-muted-foreground">Add or edit companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card-hover cursor-pointer" onClick={() => window.location.href = '/admin/users'}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-sm text-muted-foreground">Create user accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card-hover cursor-pointer" onClick={() => window.location.href = '/admin/billing'}>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-medium">Billing Tracker</h3>
                  <p className="text-sm text-muted-foreground">View payment status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
