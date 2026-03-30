import React from 'react';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { AlertCircle, MessageSquare } from 'lucide-react';

const DiscoveryStep = ({ formData, updateFormData, errors, questions }) => {
  const handleAnswerChange = (questionKey, answer) => {
    updateFormData('discovery_answers', {
      ...formData.discovery_answers,
      [questionKey]: answer
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Help Us Understand Your Needs</h3>
        <p className="text-sm text-muted-foreground">These questions help us tailor your AI receptionist</p>
      </div>
      
      <div className="grid gap-6">
        {questions.map((question, index) => (
          <div key={question.key} className="space-y-2">
            <Label className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded">
                Q{index + 1}
              </span>
              <span>
                {question.question} <span className="text-destructive">*</span>
              </span>
            </Label>
            
            {question.type === 'select' ? (
              <Select
                value={formData.discovery_answers[question.key] || ''}
                onValueChange={(value) => handleAnswerChange(question.key, value)}
              >
                <SelectTrigger 
                  className={`${errors[`discovery_${question.key}`] ? 'border-destructive' : ''}`}
                  data-testid={`onboarding-discovery-${question.key}`}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="relative">
                <Textarea
                  placeholder="Type your answer here..."
                  value={formData.discovery_answers[question.key] || ''}
                  onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                  className={`min-h-[100px] resize-none ${errors[`discovery_${question.key}`] ? 'border-destructive' : ''}`}
                  data-testid={`onboarding-discovery-${question.key}`}
                />
              </div>
            )}
            
            {errors[`discovery_${question.key}`] && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors[`discovery_${question.key}`]}
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
        <div className="flex gap-3">
          <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Your answers help us serve you better</p>
            <p className="text-sm text-muted-foreground mt-1">
              Understanding your current challenges allows us to configure your AI receptionist to 
              address your specific pain points and maximize the value you get from our service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryStep;
