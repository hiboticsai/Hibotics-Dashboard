import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Globe, 
  MessageSquare, 
  Settings, 
  Volume2,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  ExternalLink,
  Play,
  Loader2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const OnboardingDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);
  
  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/onboarding/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Submission not found');
      const data = await response.json();
      setSubmission(data);
    } catch (error) {
      toast.error('Failed to load submission');
      navigate('/admin/onboarding');
    } finally {
      setLoading(false);
    }
  };
  
  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/onboarding/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Update failed');
      const data = await response.json();
      setSubmission(prev => ({ ...prev, ...data }));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };
  
  const addNote = async () => {
    if (!newNote.trim()) return;
    
    setAddingNote(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/onboarding/submissions/${submissionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note: newNote })
      });
      
      if (!response.ok) throw new Error('Failed to add note');
      const data = await response.json();
      setSubmission(prev => ({ ...prev, admin_notes: data.admin_notes }));
      setNewNote('');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };
  
  const playVoicePreview = () => {
    if (!submission?.selected_voice_preview_url) {
      toast.error('No preview available');
      return;
    }
    
    setPlayingAudio(true);
    const audio = new Audio(submission.selected_voice_preview_url);
    audio.onended = () => setPlayingAudio(false);
    audio.onerror = () => {
      setPlayingAudio(false);
      toast.error('Failed to play preview');
    };
    audio.play();
  };
  
  const getStatusConfig = (status) => {
    const configs = {
      pending: { variant: 'warning', icon: Clock, label: 'Pending Review' },
      reviewed: { variant: 'info', icon: Eye, label: 'Under Review' },
      setup_complete: { variant: 'success', icon: CheckCircle2, label: 'Setup Complete' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    };
    return configs[status] || configs.pending;
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <DashboardLayout isAdmin>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!submission) {
    return (
      <DashboardLayout isAdmin>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Submission not found</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const statusConfig = getStatusConfig(submission.status);
  const StatusIcon = statusConfig.icon;
  
  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6" data-testid="onboarding-detail-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/onboarding')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{submission.business_name}</h1>
              <p className="text-muted-foreground">Submission #{submission.submission_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={statusConfig.variant} className="flex items-center gap-1 py-1 px-3">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </Badge>
            
            <Select value={submission.status} onValueChange={updateStatus} disabled={updating}>
              <SelectTrigger className="w-[180px]" data-testid="status-select">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="setup_complete">Setup Complete</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{submission.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${submission.email}`} className="font-medium text-primary hover:underline">
                    {submission.email}
                  </a>
                </div>
              </CardContent>
            </Card>
            
            {/* Business Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Business Name</p>
                  <p className="font-medium">{submission.business_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium capitalize">{submission.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Business Size</p>
                  <p className="font-medium">{submission.business_size}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Online Presence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.website_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Website:</span>
                    <a 
                      href={submission.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {submission.website_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {submission.facebook_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Facebook:</span>
                    <a 
                      href={submission.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {submission.facebook_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {submission.instagram_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">Instagram:</span>
                    <a 
                      href={submission.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {submission.instagram_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {submission.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-24">LinkedIn:</span>
                    <a 
                      href={submission.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {submission.linkedin_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {!submission.website_url && !submission.facebook_url && !submission.instagram_url && !submission.linkedin_url && (
                  <p className="text-sm text-muted-foreground italic">No online presence provided</p>
                )}
              </CardContent>
            </Card>
            
            {/* Discovery Answers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Discovery Answers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.discovery_questions?.map((q, index) => (
                  <div key={q.key} className="space-y-1">
                    <p className="text-sm font-medium flex items-start gap-2">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">Q{index + 1}</span>
                      {q.question}
                    </p>
                    <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                      {submission.discovery_answers?.[q.key] || <span className="text-muted-foreground italic">No answer</span>}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  Receptionist Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Business Hours</p>
                  <p className="text-sm">{submission.business_hours || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Services Offered</p>
                  <p className="text-sm whitespace-pre-wrap">{submission.services_offered || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Special Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{submission.call_handling_instructions || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
                {submission.booking_link && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Booking Link</p>
                      <a 
                        href={submission.booking_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {submission.booking_link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voice Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Selected Voice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium">{submission.selected_voice_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {submission.selected_voice_id}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={playVoicePreview}
                    disabled={playingAudio}
                  >
                    {playingAudio ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Play Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-muted-foreground">{formatDate(submission.created_at)}</p>
                  </div>
                </div>
                {submission.reviewed_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">{formatDate(submission.reviewed_at)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Notes</CardTitle>
                <CardDescription>Internal notes about this submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.admin_notes && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {submission.admin_notes}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="resize-none"
                    rows={3}
                    data-testid="admin-note-input"
                  />
                  <Button 
                    onClick={addNote} 
                    disabled={!newNote.trim() || addingNote}
                    className="w-full"
                    data-testid="add-note-btn"
                  >
                    {addingNote ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OnboardingDetail;
