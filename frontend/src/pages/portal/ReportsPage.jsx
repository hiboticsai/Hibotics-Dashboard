import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useTenant } from '../../contexts/TenantContext';
import { reportsApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FileText, Download, CalendarIcon, Clock, BarChart3, TrendingUp } from 'lucide-react';

const ReportsPage = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const [reportType, setReportType] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const handleDownloadReport = async () => {
    if (!company?.company_id) {
      toast.error('Company not found');
      return;
    }
    
    setLoading(true);
    try {
      await reportsApi.downloadPdf(company.company_id, reportType);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const reportTemplates = [
    {
      id: 'weekly',
      title: 'Weekly Summary',
      description: 'Calls, bookings, leads, and revenue for the past 7 days',
      icon: Clock
    },
    {
      id: 'monthly',
      title: 'Monthly Report',
      description: 'Comprehensive monthly performance analysis',
      icon: CalendarIcon
    },
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Detailed KPIs and conversion metrics',
      icon: BarChart3
    },
    {
      id: 'trends',
      title: 'Trends Analysis',
      description: 'Historical trends and growth patterns',
      icon: TrendingUp
    }
  ];

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Reports" 
      pageSubtitle="Generate and download performance reports"
    >
      <div className="space-y-6" data-testid="reports-page">
        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const isSelected = reportType === template.id;
            
            return (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setReportType(template.id)}
                data-testid={`report-template-${template.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">Generate Report</CardTitle>
            <CardDescription>
              Configure and download your performance report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Report Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger data-testid="report-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Report</SelectItem>
                    <SelectItem value="performance">Performance Report</SelectItem>
                    <SelectItem value="trends">Trends Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" data-testid="date-range-btn">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        'Select date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Report Preview */}
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{reportTemplates.find(t => t.id === reportType)?.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportTemplates.find(t => t.id === reportType)?.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded">Calls Handled</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Bookings</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Leads</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Revenue</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Conversion Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleDownloadReport}
                disabled={loading}
                className="btn-primary"
                data-testid="download-report-btn"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Your generated reports will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
