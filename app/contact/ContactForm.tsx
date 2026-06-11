'use client';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

const ContactForm = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 border rounded-xl bg-card text-card-foreground shadow-sm">
      <div className="p-4 rounded-full bg-primary/10">
        <Mail className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold tracking-tight">Let's connect!</h3>
        <p className="text-muted-foreground text-balance max-w-md">
          I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions.
        </p>
      </div>
      <Button 
        asChild 
        size="lg" 
        className="w-full sm:w-auto mt-4 px-8 py-6 rounded-full group"
      >
        <a href={siteConfig.links.email}>
          Say Hello
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
    </div>
  );
};
export default ContactForm;
