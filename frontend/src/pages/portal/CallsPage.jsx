import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DataTable, StatusBadge, formatDate, formatDuration } from '../../components/dashboard/DataTable';
import { useTenant } from '../../contexts/TenantContext';
import { callsApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Search, Filter, Play, FileText, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

const CallsPage = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  useEffect(() => {
    const fetchCalls = async () => {
      if (!company?.company_id) return;
      
      try {
        const params = { companyId: company.company_id };
        if (outcomeFilter !== 'all') {
          params.outcome = outcomeFilter;
        }
        
        const data = await callsApi.list(params);
        setCalls(data);
      } catch (error) {
        console.error('Failed to fetch calls:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalls();
  }, [company?.company_id, outcomeFilter]);

  const filteredCalls = calls.filter(call => 
    call.caller_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    call.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const callColumns = [
    { key: 'caller_number', label: 'Caller', render: (val) => (
      <span className="font-medium">{val}</span>
    )},
    { key: 'duration_seconds', label: 'Duration', render: (val) => (
      <span className="text-muted-foreground">{formatDuration(val)}</span>
    )},
    { key: 'outcome', label: 'Outcome', render: (val) => <StatusBadge status={val} /> },
    { key: 'summary', label: 'Summary', render: (val) => (
      <span className="text-sm text-muted-foreground truncate max-w-xs block">
        {val || 'No summary available'}
      </span>
    )},
    { key: 'created_at', label: 'Date', render: (val) => (
      <span className="text-sm text-muted-foreground">{formatDate(val)}</span>
    )}
  ];

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Call Log" 
      pageSubtitle="View and manage all AI receptionist calls"
    >
      <div className="space-y-6" data-testid="calls-page">
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by caller or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-calls-input"
                />
              </div>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="outcome-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <DataTable
          title={`Calls (${filteredCalls.length})`}
          columns={callColumns}
          data={filteredCalls}
          loading={loading}
          onRowClick={setSelectedCall}
          emptyMessage="No calls found"
        />

        {/* Call Detail Modal */}
        <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Call Details</span>
                <StatusBadge status={selectedCall?.outcome} />
              </DialogTitle>
              <DialogDescription>
                {selectedCall?.caller_number} • {formatDate(selectedCall?.created_at)}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCall && (
              <div className="space-y-6">
                {/* Call Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(selectedCall.duration_seconds)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent</p>
                    <p className="font-medium">{selectedCall.agent_id}</p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Summary */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                    {selectedCall.summary || 'No summary available for this call.'}
                  </p>
                </div>
                
                {/* Transcript */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Transcript</h4>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    {selectedCall.transcript || 'No transcript available for this call.'}
                  </div>
                </div>
                
                {/* Recording */}
                {selectedCall.recording_url && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Recording
                    </h4>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedCall.recording_url} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4 mr-2" />
                        Play Recording
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CallsPage;
