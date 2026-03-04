import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KPICard from '../../components/dashboard/KPICard';
import { LineChartWidget, AreaChartWidget } from '../../components/dashboard/Charts';
import { useTenant } from '../../contexts/TenantContext';
import { socialAccountsApi, socialMetricsApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Users, Eye, MousePointer, Link2, TrendingUp, Instagram, Facebook } from 'lucide-react';

// TikTok icon component
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const getPlatformIcon = (platform) => {
  switch (platform) {
    case 'instagram': return Instagram;
    case 'facebook': return Facebook;
    case 'tiktok': return TikTokIcon;
    default: return Users;
  }
};

const getPlatformColor = (platform) => {
  switch (platform) {
    case 'instagram': return '#E4405F';
    case 'facebook': return '#1877F2';
    case 'tiktok': return '#000000';
    default: return '#4BACC6';
  }
};

const SocialPage = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const [accounts, setAccounts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!company?.company_id) return;
      
      try {
        const [accountsData, metricsData] = await Promise.all([
          socialAccountsApi.list(company.company_id),
          socialMetricsApi.list({ companyId: company.company_id })
        ]);
        
        setAccounts(accountsData);
        setMetrics(metricsData);
      } catch (error) {
        console.error('Failed to fetch social data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [company?.company_id]);

  // Calculate totals
  const latestMetrics = accounts.map(account => {
    const accountMetrics = metrics.filter(m => m.social_account_id === account.social_account_id);
    return accountMetrics[0] || null;
  }).filter(Boolean);

  const totalFollowers = latestMetrics.reduce((sum, m) => sum + (m?.followers || 0), 0);
  const totalReach = latestMetrics.reduce((sum, m) => sum + (m?.reach || 0), 0);
  const avgEngagement = latestMetrics.length > 0 
    ? latestMetrics.reduce((sum, m) => sum + (m?.engagement_rate || 0), 0) / latestMetrics.length 
    : 0;
  const totalLinkClicks = latestMetrics.reduce((sum, m) => sum + (m?.link_clicks || 0), 0);

  // Get metrics for chart
  const getAccountTrends = (accountId) => {
    return metrics
      .filter(m => m.social_account_id === accountId)
      .map(m => ({
        date: m.date?.split('T')[0],
        followers: m.followers,
        reach: m.reach,
        engagement: m.engagement_rate
      }))
      .reverse();
  };

  if (loading) {
    return (
      <DashboardLayout portalSlug={slug} pageTitle="Social Insights">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Social Insights" 
      pageSubtitle="Track your social media performance"
    >
      <div className="space-y-6" data-testid="social-page">
        {accounts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Social Accounts Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Instagram, Facebook, or TikTok accounts to see insights here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview KPIs */}
            <div className="bento-grid">
              <div className="bento-item-sm">
                <KPICard
                  title="Total Followers"
                  value={totalFollowers}
                  change={8}
                  changeType="up"
                  icon={Users}
                />
              </div>
              <div className="bento-item-sm">
                <KPICard
                  title="Total Reach"
                  value={totalReach}
                  change={12}
                  changeType="up"
                  icon={Eye}
                />
              </div>
              <div className="bento-item-sm">
                <KPICard
                  title="Avg Engagement"
                  value={avgEngagement.toFixed(1)}
                  format="percentage"
                  change={3}
                  changeType="up"
                  icon={TrendingUp}
                />
              </div>
              <div className="bento-item-sm">
                <KPICard
                  title="Link Clicks"
                  value={totalLinkClicks}
                  change={15}
                  changeType="up"
                  icon={MousePointer}
                />
              </div>
            </div>

            {/* Connected Accounts */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-medium">Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {accounts.map(account => {
                    const Icon = getPlatformIcon(account.platform);
                    return (
                      <div
                        key={account.social_account_id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50"
                      >
                        <Icon className="h-5 w-5" style={{ color: getPlatformColor(account.platform) }} />
                        <span className="font-medium capitalize">{account.platform}</span>
                        <Badge variant="secondary" className="text-xs">
                          @{account.account_id}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Platform-specific tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Platforms</TabsTrigger>
                {accounts.map(account => (
                  <TabsTrigger key={account.social_account_id} value={account.social_account_id}>
                    {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {accounts.map(account => {
                    const trends = getAccountTrends(account.social_account_id);
                    return (
                      <AreaChartWidget
                        key={account.social_account_id}
                        data={trends}
                        dataKey="followers"
                        xAxisKey="date"
                        title={`${account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} Followers`}
                        color={getPlatformColor(account.platform)}
                      />
                    );
                  })}
                </div>
              </TabsContent>

              {accounts.map(account => {
                const trends = getAccountTrends(account.social_account_id);
                const latestMetric = metrics.find(m => m.social_account_id === account.social_account_id);
                
                return (
                  <TabsContent key={account.social_account_id} value={account.social_account_id} className="mt-6 space-y-6">
                    {/* Platform KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <KPICard title="Followers" value={latestMetric?.followers || 0} icon={Users} />
                      <KPICard title="Reach" value={latestMetric?.reach || 0} icon={Eye} />
                      <KPICard title="Impressions" value={latestMetric?.impressions || 0} icon={Eye} />
                      <KPICard title="Profile Visits" value={latestMetric?.profile_visits || 0} icon={MousePointer} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <LineChartWidget
                        data={trends}
                        lines={[
                          { dataKey: 'followers', name: 'Followers' },
                          { dataKey: 'reach', name: 'Reach' }
                        ]}
                        xAxisKey="date"
                        title="Growth Trends"
                      />
                      <AreaChartWidget
                        data={trends}
                        dataKey="engagement"
                        xAxisKey="date"
                        title="Engagement Rate (%)"
                        color={getPlatformColor(account.platform)}
                      />
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SocialPage;
