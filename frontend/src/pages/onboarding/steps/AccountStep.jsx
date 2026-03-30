import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { AlertCircle, User, Mail, Lock, CheckCircle2 } from 'lucide-react';

const AccountStep = ({ formData, updateFormData, errors, isAuthenticated }) => {
  if (isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">You're Already Logged In</h3>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{formData.name || formData.email}</span>!
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your account information will be used for this onboarding.
          </p>
        </div>
        
        <div className="grid gap-4 mt-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Name</Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{formData.name || 'Not set'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Email</Label>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{formData.email}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Create Your Account</h3>
        <p className="text-sm text-muted-foreground">Start by setting up your login credentials</p>
      </div>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
              data-testid="onboarding-name-input"
            />
          </div>
          {errors.name && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.name}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@yourbusiness.com"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              data-testid="onboarding-email-input"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.email}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
              data-testid="onboarding-password-input"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.password}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              data-testid="onboarding-confirm-password-input"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        Already have an account?{' '}
        <a href="/login" className="text-primary hover:underline">Sign in here</a>
      </p>
    </div>
  );
};

export default AccountStep;
