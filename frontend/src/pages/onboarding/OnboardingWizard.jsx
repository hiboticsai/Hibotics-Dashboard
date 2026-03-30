import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

// Step Components
import AccountStep from './steps/AccountStep';
import BusinessProfileStep from './steps/BusinessProfileStep';
import WebsiteInfoStep from './steps/WebsiteInfoStep';
import DiscoveryStep from './steps/DiscoveryStep';
import PreferencesStep from './steps/PreferencesStep';
import VoicePickerStep from './steps/VoicePickerStep';
import ReviewStep from './steps/ReviewStep';

const API = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, title: 'Account', description: 'Create your account' },
  { id: 2, title: 'Business', description: 'Tell us about your business' },
  { id: 3, title: 'Website', description: 'Your online presence' },
  { id: 4, title: 'Discovery', description: 'Help us understand your needs' },
  { id: 5, title: 'Preferences', description: 'Receptionist settings' },
  { id: 6, title: 'Voice', description: 'Choose your AI voice' },
  { id: 7, title: 'Review', description: 'Confirm and submit' },
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(isAuthenticated ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveryQuestions, setDiscoveryQuestions] = useState([]);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Business Profile
    business_name: '',
    industry: '',
    business_size: '',
    
    // Step 3: Website Info
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    
    // Step 4: Discovery Answers
    discovery_answers: {},
    
    // Step 5: Preferences
    business_hours: '',
    call_handling_instructions: '',
    services_offered: '',
    booking_link: '',
    
    // Step 6: Voice Selection
    selected_voice: null,
  });
  
  // Step validation errors
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    // Fetch discovery questions
    fetch(`${API}/api/onboarding/discovery-questions`)
      .then(res => res.json())
      .then(data => setDiscoveryQuestions(data))
      .catch(err => console.error('Failed to load questions:', err));
  }, []);
  
  useEffect(() => {
    // If user is authenticated, skip account step and pre-fill data
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [isAuthenticated, user, currentStep]);
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!isAuthenticated) {
          if (!formData.name?.trim()) newErrors.name = 'Name is required';
          if (!formData.email?.trim()) newErrors.email = 'Email is required';
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
          if (!formData.password) newErrors.password = 'Password is required';
          else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
          if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
      case 2:
        if (!formData.business_name?.trim()) newErrors.business_name = 'Business name is required';
        if (!formData.industry) newErrors.industry = 'Please select an industry';
        if (!formData.business_size) newErrors.business_size = 'Please select business size';
        break;
      case 3:
        // Website info is optional
        if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
          newErrors.website_url = 'Please enter a valid URL (starting with http:// or https://)';
        }
        break;
      case 4:
        // Check that required discovery questions are answered
        discoveryQuestions.forEach(q => {
          if (!formData.discovery_answers[q.key]) {
            newErrors[`discovery_${q.key}`] = 'This question is required';
          }
        });
        break;
      case 5:
        // Preferences are optional but recommended
        break;
      case 6:
        if (!formData.selected_voice) newErrors.selected_voice = 'Please select a voice for your AI receptionist';
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };
  
  const handleBack = () => {
    // Skip account step if authenticated
    if (currentStep === 2 && isAuthenticated) {
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, isAuthenticated ? 2 : 1));
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Format discovery answers
      const discoveryAnswers = Object.entries(formData.discovery_answers).map(([key, answer]) => ({
        question_key: key,
        answer: answer
      }));
      
      const payload = {
        name: formData.name,
        email: formData.email,
        password: !isAuthenticated ? formData.password : undefined,
        business_name: formData.business_name,
        industry: formData.industry,
        business_size: formData.business_size,
        website_url: formData.website_url || null,
        facebook_url: formData.facebook_url || null,
        instagram_url: formData.instagram_url || null,
        linkedin_url: formData.linkedin_url || null,
        discovery_answers: discoveryAnswers,
        business_hours: formData.business_hours || null,
        call_handling_instructions: formData.call_handling_instructions || null,
        services_offered: formData.services_offered || null,
        booking_link: formData.booking_link || null,
        selected_voice: {
          voice_id: formData.selected_voice.voice_id,
          voice_name: formData.selected_voice.name,
          preview_url: formData.selected_voice.preview_url || null
        }
      };
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API}/api/onboarding/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Submission failed');
      }
      
      const result = await response.json();
      
      // If new user, store the token
      if (result.access_token) {
        localStorage.setItem('auth_token', result.access_token);
      }
      
      toast.success('Onboarding Complete!', {
        description: 'Our team will review your submission and set up your AI receptionist.'
      });
      
      // Navigate to success page
      navigate('/onboarding/success', { state: { submissionId: result.submission_id } });
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission Failed', {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const progress = (currentStep / STEPS.length) * 100;
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AccountStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            isAuthenticated={isAuthenticated}
          />
        );
      case 2:
        return (
          <BusinessProfileStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <WebsiteInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return (
          <DiscoveryStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            questions={discoveryQuestions}
          />
        );
      case 5:
        return (
          <PreferencesStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 6:
        return (
          <VoicePickerStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 7:
        return (
          <ReviewStep
            formData={formData}
            discoveryQuestions={discoveryQuestions}
            onEdit={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_hibotics-analytics/artifacts/r3t3k0rb_hibotics_ai_logo_transparent%20%282%29.png"
            alt="HiBotics AI"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Welcome to HiBotics AI</h1>
          <p className="text-muted-foreground mt-2">Let's set up your AI-powered receptionist</p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                    ? 'text-primary/60'
                    : 'text-muted-foreground/40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 transition-all ${
                    step.id === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : step.id < currentStep
                      ? 'bg-primary/60 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Main Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          
          <CardContent className="min-h-[400px]">
            {renderStep()}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || (currentStep === 2 && isAuthenticated)}
              data-testid="onboarding-back-btn"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {currentStep < 7 ? (
              <Button onClick={handleNext} data-testid="onboarding-next-btn">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
                data-testid="onboarding-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Onboarding
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact us at <a href="mailto:support@hibotics.ai" className="text-primary hover:underline">support@hibotics.ai</a>
        </p>
      </div>
    </div>
  );
};

export default OnboardingWizard;
