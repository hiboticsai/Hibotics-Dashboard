import React from 'react';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { 
  User, Building2, Globe, MessageSquare, Settings, Volume2, 
  Edit2, CheckCircle2, ExternalLink 
} from 'lucide-react';

const ReviewStep = ({ formData, discoveryQuestions, onEdit }) => {
  const sections = [
    {
      title: 'Account Information',
      icon: User,
      step: 1,
      items: [
        { label: 'Name', value: formData.name },
        { label: 'Email', value: formData.email },
      ]
    },
    {
      title: 'Business Profile',
      icon: Building2,
      step: 2,
      items: [
        { label: 'Business Name', value: formData.business_name },
        { label: 'Industry', value: formData.industry },
        { label: 'Business Size', value: formData.business_size },
      ]
    },
    {
      title: 'Online Presence',
      icon: Globe,
      step: 3,
      items: [
        { label: 'Website', value: formData.website_url, isLink: true },
        { label: 'Facebook', value: formData.facebook_url, isLink: true },
        { label: 'Instagram', value: formData.instagram_url, isLink: true },
        { label: 'LinkedIn', value: formData.linkedin_url, isLink: true },
      ].filter(item => item.value)
    },
    {
      title: 'Discovery Answers',
      icon: MessageSquare,
      step: 4,
      items: discoveryQuestions.map(q => ({
        label: q.question,
        value: formData.discovery_answers[q.key],
        isLongText: q.type === 'textarea'
      }))
    },
    {
      title: 'Receptionist Preferences',
      icon: Settings,
      step: 5,
      items: [
        { label: 'Business Hours', value: formData.business_hours },
        { label: 'Services Offered', value: formData.services_offered, isLongText: true },
        { label: 'Special Instructions', value: formData.call_handling_instructions, isLongText: true },
        { label: 'Booking Link', value: formData.booking_link, isLink: true },
      ].filter(item => item.value)
    },
    {
      title: 'Selected Voice',
      icon: Volume2,
      step: 6,
      items: [
        { label: 'Voice Name', value: formData.selected_voice?.name },
      ]
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-medium">Review Your Information</h3>
        <p className="text-sm text-muted-foreground">Please verify everything looks correct before submitting</p>
      </div>
      
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">{section.title}</h4>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(section.step)}
                className="text-xs h-7"
                data-testid={`edit-step-${section.step}`}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No information provided</p>
              ) : (
                section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className={item.isLongText ? 'space-y-1' : 'flex justify-between items-start gap-4'}>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    {item.isLink ? (
                      <a 
                        href={item.value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                      >
                        {item.value}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : item.isLongText ? (
                      <p className="text-sm text-foreground mt-1">{item.value || '-'}</p>
                    ) : (
                      <span className="text-sm text-foreground text-right">{item.value || '-'}</span>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {sectionIndex < sections.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">What happens next?</span>
          <br />
          After you submit, our team will review your information and begin setting up your AI receptionist. 
          We'll reach out within 24-48 hours to finalize the configuration and get you started!
        </p>
      </div>
    </div>
  );
};

export default ReviewStep;
