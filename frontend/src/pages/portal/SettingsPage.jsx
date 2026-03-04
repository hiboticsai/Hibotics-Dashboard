import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useTenant } from '../../contexts/TenantContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { User, Building2, Palette, Bell, Shield, Moon, Sun } from 'lucide-react';

const SettingsPage = () => {
  const { slug } = useParams();
  const { company } = useTenant();
  const { theme, toggleTheme, branding } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    newBooking: true,
    newLead: true,
    weeklyReport: true
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardLayout 
      portalSlug={slug} 
      pageTitle="Settings" 
      pageSubtitle="Manage your account and preferences"
    >
      <div className="space-y-6" data-testid="settings-page">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" data-testid="profile-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" data-testid="profile-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 555-0123" data-testid="profile-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value="Client" disabled data-testid="profile-role" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="btn-primary" data-testid="save-profile-btn">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  View your company details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={company?.company_name || ''} disabled data-testid="company-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input value={company?.industry || ''} disabled data-testid="company-industry" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input value={company?.contact_name || ''} disabled data-testid="company-contact" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={company?.email || ''} disabled data-testid="company-email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={company?.phone || ''} disabled data-testid="company-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Service Price</Label>
                    <Input value={`$${company?.avg_service_price || 0}`} disabled data-testid="company-price" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to update company information.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the dashboard looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={toggleTheme}
                    className="gap-2"
                    data-testid="theme-toggle-settings"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Branding Preview */}
                <div className="space-y-4">
                  <Label>Current Branding</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Brand Name</p>
                      <p className="font-medium">{branding.brandName}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Primary Color</p>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: branding.primaryColor }}
                        />
                        <span className="text-sm">{branding.primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Accent Color</p>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: branding.accentColor }}
                        />
                        <span className="text-sm">{branding.accentColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Powered By</p>
                      <p className="font-medium">{branding.showPoweredBy ? 'Visible' : 'Hidden'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      data-testid="notification-email"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                      data-testid="notification-sms"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>New Booking Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a new booking is made
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newBooking}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newBooking: checked })}
                      data-testid="notification-booking"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>New Lead Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a new lead is captured
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newLead}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newLead: checked })}
                      data-testid="notification-lead"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly performance summaries
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                      data-testid="notification-weekly"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="btn-primary" data-testid="save-notifications-btn">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
