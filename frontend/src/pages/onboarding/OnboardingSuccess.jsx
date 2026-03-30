import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle2, Mail, Clock, ArrowRight } from 'lucide-react';

const OnboardingSuccess = () => {
  const location = useLocation();
  const submissionId = location.state?.submissionId;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full">
        <Card className="border-border/50 shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-primary/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Onboarding Complete!
            </h1>
            <p className="text-muted-foreground">
              Thank you for choosing HiBotics AI
            </p>
          </div>
          
          <CardContent className="p-8 space-y-6">
            {/* Submission ID */}
            {submissionId && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                <p className="font-mono text-sm">{submissionId}</p>
              </div>
            )}
            
            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">What happens next?</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Review (24-48 hours)</p>
                    <p className="text-sm text-muted-foreground">
                      Our team will review your submission and prepare your AI receptionist configuration.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Setup Call</p>
                    <p className="text-sm text-muted-foreground">
                      We'll schedule a brief call to finalize your AI receptionist settings and answer any questions.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Go Live!</p>
                    <p className="text-sm text-muted-foreground">
                      Once everything is configured, we'll activate your AI receptionist and you can start receiving calls.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Questions? Reach out to us at{' '}
                <a href="mailto:support@hibotics.ai" className="text-primary hover:underline">
                  support@hibotics.ai
                </a>
              </p>
            </div>
            
            {/* CTA */}
            <div className="pt-4">
              <Link to="/login">
                <Button className="w-full" data-testid="go-to-login-btn">
                  Go to Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Powered by{' '}
          <a 
            href="https://hiboticsai.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            HiBotics AI
          </a>
        </p>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
