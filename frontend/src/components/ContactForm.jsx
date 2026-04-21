import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Concatenate subject into message since schema doesn't have subject column
      const finalMessage = `Subject: ${formData.subject}\n\n${formData.message}`;

      const { error } = await supabase
        .from('contacts')
        .insert([{
          name: formData.name,
          email: formData.email,
          message: finalMessage
        }]);

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We will get back to you shortly.",
        className: "bg-green-900 border-green-800 text-white"
      });

      setFormData({ name: '', email: '', subject: '', message: '' });

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = "Failed to send message. Please try again later.";
      
      // Check for network errors
      if (error.message === 'Failed to fetch' || error.status === 0) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code) {
        // Supabase specific error codes
        errorMessage = `Server error (${error.code}). Please try again later.`;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-300">Name</label>
          <input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            className="w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="Your email address"
            className="w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-gray-300">Subject</label>
        <input
          id="subject"
          name="subject"
          required
          value={formData.subject}
          onChange={handleChange}
          placeholder="How can we help?"
          className="w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-gray-300">Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="Write your message here..."
          className="w-full rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
};

export default ContactForm;