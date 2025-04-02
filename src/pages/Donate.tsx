
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Copy, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const BITCOIN_ADDRESS = 'bc1qeyh7ws3r3jc8y3mt9uu5q0h7mj3glmasxpxrnx';

export default function Donate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(BITCOIN_ADDRESS);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Bitcoin address has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Please try to copy the address manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Receive Address</h1>
          <div className="w-[74px]"></div> {/* Spacer for centering */}
        </div>

        <div className="bg-background border rounded-lg p-6 flex flex-col items-center">
          <div className="bg-white p-3 rounded-lg mb-6">
            <img 
              src="/lovable-uploads/bd4c6cab-cf67-40a9-9ea1-bbccce583e4e.png" 
              alt="Bitcoin QR Code" 
              className="w-60 h-60"
            />
          </div>
          
          <h2 className="text-xl font-medium mb-4">Your Bitcoin Address</h2>
          
          <div className="w-full bg-muted p-3 rounded-md mb-4 flex items-center">
            <div className="text-xs break-all flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {BITCOIN_ADDRESS}
            </div>
          </div>
          
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={copyToClipboard}
            >
              {copied ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Address
            </Button>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Thank you for supporting our application. Your donation helps us continue improving our services.
          </p>
        </div>
      </div>
    </Layout>
  );
}
