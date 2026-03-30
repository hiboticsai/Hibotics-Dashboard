import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { AlertCircle, Building2, Briefcase, Users } from 'lucide-react';

const INDUSTRIES = [
  { value: 'beauty', label: 'Beauty & Spa' },
  { value: 'wellness', label: 'Wellness & Health' },
  { value: 'medical', label: 'Medical & Dental' },
  { value: 'fitness', label: 'Fitness & Gym' },
  { value: 'restaurant', label: 'Restaurant & Hospitality' },
  { value: 'automotive', label: 'Automotive Services' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'legal', label: 'Legal Services' },
  { value: 'accounting', label: 'Accounting & Finance' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education & Training' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];

const BUSINESS_SIZES = [
  { value: 'solo', label: 'Just me (Solo)' },
  { value: '2-5', label: '2-5 employees' },
  { value: '6-10', label: '6-10 employees' },
  { value: '11-25', label: '11-25 employees' },
  { value: '26-50', label: '26-50 employees' },
  { value: '50+', label: '50+ employees' },
];

const BusinessProfileStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Tell Us About Your Business</h3>
        <p className="text-sm text-muted-foreground">Help us customize your AI receptionist experience</p>
      </div>
      
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="business_name">
            Business Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="business_name"
              placeholder="Acme Beauty Salon"
              value={formData.business_name}
              onChange={(e) => updateFormData('business_name', e.target.value)}
              className={`pl-10 ${errors.business_name ? 'border-destructive' : ''}`}
              data-testid="onboarding-business-name-input"
            />
          </div>
          {errors.business_name && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.business_name}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="industry">
            Industry <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Select
              value={formData.industry}
              onValueChange={(value) => updateFormData('industry', value)}
            >
              <SelectTrigger 
                className={`${errors.industry ? 'border-destructive' : ''}`}
                data-testid="onboarding-industry-select"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select your industry" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.industry && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.industry}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="business_size">
            Business Size <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Select
              value={formData.business_size}
              onValueChange={(value) => updateFormData('business_size', value)}
            >
              <SelectTrigger 
                className={`${errors.business_size ? 'border-destructive' : ''}`}
                data-testid="onboarding-size-select"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="How many people work at your business?" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.business_size && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.business_size}
            </p>
          )}
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Why do we need this?</span>
          <br />
          Understanding your industry and size helps us train your AI receptionist with the right vocabulary, 
          tone, and responses tailored to your business type.
        </p>
      </div>
    </div>
  );
};

export default BusinessProfileStep;
