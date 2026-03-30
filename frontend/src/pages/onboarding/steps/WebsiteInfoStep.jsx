import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { AlertCircle, Globe, Facebook, Instagram, Linkedin } from 'lucide-react';

const WebsiteInfoStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Your Online Presence</h3>
        <p className="text-sm text-muted-foreground">Share your website and social media links (all optional)</p>
      </div>
      
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="website_url"
              placeholder="https://yourbusiness.com"
              value={formData.website_url}
              onChange={(e) => updateFormData('website_url', e.target.value)}
              className={`pl-10 ${errors.website_url ? 'border-destructive' : ''}`}
              data-testid="onboarding-website-input"
            />
          </div>
          {errors.website_url && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.website_url}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="facebook_url">Facebook Page</Label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="facebook_url"
              placeholder="https://facebook.com/yourbusiness"
              value={formData.facebook_url}
              onChange={(e) => updateFormData('facebook_url', e.target.value)}
              className="pl-10"
              data-testid="onboarding-facebook-input"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram Profile</Label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="instagram_url"
              placeholder="https://instagram.com/yourbusiness"
              value={formData.instagram_url}
              onChange={(e) => updateFormData('instagram_url', e.target.value)}
              className="pl-10"
              data-testid="onboarding-instagram-input"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn Page</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="linkedin_url"
              placeholder="https://linkedin.com/company/yourbusiness"
              value={formData.linkedin_url}
              onChange={(e) => updateFormData('linkedin_url', e.target.value)}
              className="pl-10"
              data-testid="onboarding-linkedin-input"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Why is this helpful?</span>
          <br />
          Your online presence helps us understand your brand better. Our team can review your website to 
          customize your AI receptionist's responses with accurate information about your services.
        </p>
      </div>
    </div>
  );
};

export default WebsiteInfoStep;
