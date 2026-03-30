import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Clock, Phone, List, Link2 } from 'lucide-react';

const PreferencesStep = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Receptionist Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure how your AI receptionist should operate</p>
      </div>
      
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="business_hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Business Hours
          </Label>
          <Input
            id="business_hours"
            placeholder="e.g., Mon-Fri 9am-6pm, Sat 10am-4pm"
            value={formData.business_hours}
            onChange={(e) => updateFormData('business_hours', e.target.value)}
            data-testid="onboarding-hours-input"
          />
          <p className="text-xs text-muted-foreground">
            Let your AI know when your business is open to inform callers accurately.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="services_offered" className="flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            Services Offered
          </Label>
          <Textarea
            id="services_offered"
            placeholder="e.g., Haircuts, Coloring, Facials, Massage, Manicure/Pedicure..."
            value={formData.services_offered}
            onChange={(e) => updateFormData('services_offered', e.target.value)}
            className="min-h-[80px] resize-none"
            data-testid="onboarding-services-input"
          />
          <p className="text-xs text-muted-foreground">
            List the main services you offer so your AI can answer service-related questions.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="call_handling_instructions" className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Special Instructions
          </Label>
          <Textarea
            id="call_handling_instructions"
            placeholder="e.g., Always offer to book a consultation, mention our current 20% off promotion, transfer urgent calls to my mobile..."
            value={formData.call_handling_instructions}
            onChange={(e) => updateFormData('call_handling_instructions', e.target.value)}
            className="min-h-[100px] resize-none"
            data-testid="onboarding-instructions-input"
          />
          <p className="text-xs text-muted-foreground">
            Any special instructions for how calls should be handled.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="booking_link" className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Online Booking Link
          </Label>
          <Input
            id="booking_link"
            placeholder="https://calendly.com/yourbusiness or booking page URL"
            value={formData.booking_link}
            onChange={(e) => updateFormData('booking_link', e.target.value)}
            data-testid="onboarding-booking-input"
          />
          <p className="text-xs text-muted-foreground">
            If you have an online booking system, we can direct callers to it.
          </p>
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Don't worry!</span>
          <br />
          You can always update these preferences later. Our team will also work with you during 
          setup to fine-tune your AI receptionist's responses.
        </p>
      </div>
    </div>
  );
};

export default PreferencesStep;
