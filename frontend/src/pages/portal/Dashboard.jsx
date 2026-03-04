import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KPICard from '../../components/dashboard/KPICard';
import { AreaChartWidget, PieChartWidget, LineChartWidget } from '../../components/dashboard/Charts';
import { DataTable, StatusBadge, formatDate, formatDuration } from '../../components/dashboard/DataTable';
import { useTenant } from '../../contexts/TenantContext';
import { dashboardApi, callsApi } from '../../lib/api';
import { Phone, Calendar, Users, Clock, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

const ClientDashboard = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const [kpis, setKpis] = useState(null);
  const [callTrends, setCallTrends] = useState([]);
  const [outcomeDistribution, setOutcomeDistribution] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!company?.company_id) return;
      
      try {
        const [kpisData, trendsData, distributionData, callsData] = await Promise.all([
          dashboardApi.getKPIs(company.company_id),
          dashboardApi.getCallTrends(company.company_id, 14),
          dashboardApi.getOutcomeDistribution(company.company_id),
          callsApi.list({ companyId: company.company_id })
        ]);
        
        setKpis(kpisData);
        setCallTrends(trendsData);
        setOutcomeDistribution(distributionData);
        setRecentCalls(callsData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [company?.company_id]);

  const callColumns = [
    { key: 'caller_number', label: 'Caller' },
    { key: 'duration_seconds', label: 'Duration', render: (val) => formatDuration(val) },
    { key: 'outcome', label: 'Outcome', render: (val) => <StatusBadge status={val} /> },
    { key: 'created_at', label: 'Date', render: (val) => formatDate(val) }
  ];

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Dashboard" 
      pageSubtitle="AI Voice Receptionist Analytics"
    >
      <div className="space-y-8" data-testid="client-dashboard">
        {/* KPI Cards */}
        <div className="bento-grid">
          <div className="bento-item-sm">
            <KPICard
              title="Calls Handled"
              value={kpis?.calls_handled || 0}
              change={12}
              changeType="up"
              icon={Phone}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Bookings Created"
              value={kpis?.bookings_created || 0}
              change={8}
              changeType="up"
              icon={Calendar}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Leads Captured"
              value={kpis?.leads_captured || 0}
              change={15}
              changeType="up"
              icon={Users}
            />
          </div>
          <div className="bento-item-sm">
            <KPICard
              title="Minutes Used"
              value={kpis?.minutes_used || 0}
              suffix=" min"
              icon={Clock}
            />
          </div>
        </div>

        {/* Second Row KPIs */}
        <div className="bento-grid">
          <div className="bento-item-md">
            <KPICard
              title="Avg Call Duration"
              value={kpis?.avg_call_duration || 0}
              format="duration"
              icon={BarChart3}
            />
          </div>
          <div className="bento-item-md">
            <KPICard
              title="Conversion Rate"
              value={kpis?.conversion_rate || 0}
              format="percentage"
              change={5}
              changeType="up"
              icon={TrendingUp}
            />
          </div>
          <div className="bento-item-md">
            <KPICard
              title="Estimated Revenue"
              value={kpis?.estimated_revenue || 0}
              format="currency"
              change={18}
              changeType="up"
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="bento-grid">
          <div className="bento-item-lg">
            <LineChartWidget
              data={callTrends}
              lines={[
                { dataKey: 'calls', name: 'Total Calls' },
                { dataKey: 'bookings', name: 'Bookings' }
              ]}
              xAxisKey="date"
              title="Call Trends (Last 14 Days)"
            />
          </div>
          <div className="bento-item-lg">
            <PieChartWidget
              data={outcomeDistribution}
              title="Call Outcomes"
            />
          </div>
        </div>

        {/* Recent Calls */}
        <DataTable
          title="Recent Calls"
          columns={callColumns}
          data={recentCalls}
          loading={loading}
          emptyMessage="No calls recorded yet"
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
