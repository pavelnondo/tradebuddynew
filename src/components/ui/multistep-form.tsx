"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const steps = [
  { id: "personal", title: "Personal Info" },
  { id: "professional", title: "Professional" },
  { id: "goals", title: "Goals" },
  { id: "design", title: "Design" },
  { id: "budget", title: "Budget" },
  { id: "requirements", title: "Requirements" },
];

export interface MultistepFormData {
  name: string;
  email: string;
  company: string;
  profession: string;
  experience: string;
  industry: string;
  primaryGoal: string;
  targetAudience: string;
  contentTypes: string[];
  colorPreference: string;
  stylePreference: string;
  inspirations: string;
  budget: string;
  timeline: string;
  features: string[];
  additionalInfo: string;
}

export const defaultFormData: MultistepFormData = {
  name: "",
  email: "",
  company: "",
  profession: "",
  experience: "",
  industry: "",
  primaryGoal: "",
  targetAudience: "",
  contentTypes: [],
  colorPreference: "",
  stylePreference: "",
  inspirations: "",
  budget: "",
  timeline: "",
  features: [],
  additionalInfo: "",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

export interface OnboardingFormProps {
  steps?: typeof steps;
  onSubmit?: (data: MultistepFormData) => void | Promise<void>;
  onCancel?: () => void;
}

export function OnboardingForm({
  steps: customSteps = steps,
  onSubmit: onSubmitProp,
  onCancel,
}: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MultistepFormData>(defaultFormData);

  const updateFormData = (field: keyof MultistepFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const features = [...prev.features];
      if (features.includes(feature)) {
        return { ...prev, features: features.filter((f) => f !== feature) };
      }
      return { ...prev, features: [...features, feature] };
    });
  };

  const toggleContentType = (type: string) => {
    setFormData((prev) => {
      const types = [...prev.contentTypes];
      if (types.includes(type)) {
        return { ...prev, contentTypes: types.filter((t) => t !== type) };
      }
      return { ...prev, contentTypes: [...types, type] };
    });
  };

  const nextStep = () => {
    if (currentStep < customSteps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitProp?.(formData);
      toast.success("Form submitted successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== "" && formData.email.trim() !== "";
      case 1:
        return formData.profession.trim() !== "" && formData.industry !== "";
      case 2:
        return formData.primaryGoal !== "";
      case 3:
        return formData.stylePreference !== "";
      case 4:
        return formData.budget !== "" && formData.timeline !== "";
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between mb-2">
          {customSteps.map((step, index) => (
            <motion.div key={step.id} className="flex flex-col items-center" whileHover={{ scale: 1.1 }}>
              <motion.div
                className={cn(
                  "w-4 h-4 rounded-full cursor-pointer transition-colors",
                  index < currentStep ? "bg-primary" : index === currentStep ? "bg-primary ring-4 ring-primary/20" : "bg-muted"
                )}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                whileTap={{ scale: 0.95 }}
              />
              <span className={cn("text-xs mt-1.5 hidden sm:block", index === currentStep ? "text-primary font-medium" : "text-muted-foreground")}>
                {step.title}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (customSteps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card className="border shadow-md rounded-3xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial="hidden" animate="visible" exit="exit" variants={contentVariants}>
              {currentStep === 0 && (
                <>
                  <CardHeader>
                    <CardTitle>Tell us about yourself</CardTitle>
                    <CardDescription>Basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => updateFormData("name", e.target.value)} />
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} />
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input id="company" placeholder="Your Company" value={formData.company} onChange={(e) => updateFormData("company", e.target.value)} />
                    </motion.div>
                  </CardContent>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Professional Background</CardTitle>
                    <CardDescription>Your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Input id="profession" placeholder="e.g. Designer, Developer" value={formData.profession} onChange={(e) => updateFormData("profession", e.target.value)} />
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={formData.industry} onValueChange={(v) => updateFormData("industry", v)}>
                        <SelectTrigger id="industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  </CardContent>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Goals</CardTitle>
                    <CardDescription>What are you trying to achieve?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Primary goal</Label>
                      <RadioGroup value={formData.primaryGoal} onValueChange={(v) => updateFormData("primaryGoal", v)} className="space-y-2">
                        {[
                          { value: "showcase", label: "Showcase portfolio" },
                          { value: "sell", label: "Sell products/services" },
                          { value: "generate-leads", label: "Generate leads" },
                          { value: "provide-info", label: "Provide information" },
                        ].map((g) => (
                          <div key={g.value} className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value={g.value} id={g.value} />
                            <Label htmlFor={g.value} className="cursor-pointer w-full">{g.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="targetAudience">Target audience</Label>
                      <Textarea id="targetAudience" placeholder="Describe your ideal visitors" value={formData.targetAudience} onChange={(e) => updateFormData("targetAudience", e.target.value)} className="min-h-[80px]" />
                    </motion.div>
                  </CardContent>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Design Preferences</CardTitle>
                    <CardDescription>Your aesthetic preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Style</Label>
                      <RadioGroup value={formData.stylePreference} onValueChange={(v) => updateFormData("stylePreference", v)} className="space-y-2">
                        {[
                          { value: "modern", label: "Modern & Sleek" },
                          { value: "minimalist", label: "Minimalist" },
                          { value: "bold", label: "Bold & Creative" },
                          { value: "corporate", label: "Corporate & Professional" },
                        ].map((s) => (
                          <div key={s.value} className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value={s.value} id={s.value} />
                            <Label htmlFor={s.value} className="cursor-pointer w-full">{s.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="inspirations">Inspirations</Label>
                      <Textarea id="inspirations" placeholder="Websites you admire" value={formData.inspirations} onChange={(e) => updateFormData("inspirations", e.target.value)} className="min-h-[80px]" />
                    </motion.div>
                  </CardContent>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <CardHeader>
                    <CardTitle>Budget & Timeline</CardTitle>
                    <CardDescription>Investment and timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Budget</Label>
                      <Select value={formData.budget} onValueChange={(v) => updateFormData("budget", v)}>
                        <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-1000">Under $1,000</SelectItem>
                          <SelectItem value="1000-3000">$1,000 - $3,000</SelectItem>
                          <SelectItem value="3000-5000">$3,000 - $5,000</SelectItem>
                          <SelectItem value="over-10000">Over $10,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Timeline</Label>
                      <RadioGroup value={formData.timeline} onValueChange={(v) => updateFormData("timeline", v)} className="space-y-2">
                        {[
                          { value: "asap", label: "ASAP" },
                          { value: "1-month", label: "Within 1 month" },
                          { value: "3-months", label: "1-3 months" },
                          { value: "flexible", label: "Flexible" },
                        ].map((t) => (
                          <div key={t.value} className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                            <RadioGroupItem value={t.value} id={t.value} />
                            <Label htmlFor={t.value} className="cursor-pointer w-full">{t.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                  </CardContent>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <CardHeader>
                    <CardTitle>Additional Requirements</CardTitle>
                    <CardDescription>Any other needs?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label>Features</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Contact Form", "Blog", "E-commerce", "User Accounts", "Search", "Analytics"].map((f) => (
                          <div
                            key={f}
                            className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent"
                            onClick={() => toggleFeature(f.toLowerCase())}
                          >
                            <Checkbox id={f} checked={formData.features.includes(f.toLowerCase())} onCheckedChange={() => toggleFeature(f.toLowerCase())} />
                            <Label htmlFor={f} className="cursor-pointer w-full">{f}</Label>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div variants={fadeInUp} className="space-y-2">
                      <Label htmlFor="additionalInfo">Anything else?</Label>
                      <Textarea id="additionalInfo" placeholder="Additional requirements" value={formData.additionalInfo} onChange={(e) => updateFormData("additionalInfo", e.target.value)} className="min-h-[80px]" />
                    </motion.div>
                  </CardContent>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <CardFooter className="flex justify-between pt-6 pb-4">
            <Button type="button" variant="outline" onClick={currentStep === 0 ? onCancel : prevStep} disabled={currentStep === 0 && !onCancel} className="flex items-center gap-1 rounded-2xl">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              onClick={currentStep === customSteps.length - 1 ? handleSubmit : nextStep}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center gap-1 rounded-2xl"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <>
                  {currentStep === customSteps.length - 1 ? "Submit" : "Next"}
                  {currentStep === customSteps.length - 1 ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {customSteps.length}: {customSteps[currentStep].title}
      </p>
    </div>
  );
}
