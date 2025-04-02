
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Copy, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BITCOIN_ADDRESS = 'bc1qeyh7ws3r3jc8y3mt9uu5q0h7mj3glmasxpxrnx';
const ETHEREUM_ADDRESS = '0x0a0BeFF80798Ac4Ea76Ab13af6154556804421d6';

export default function Donate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const copyToClipboard = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(type);
      toast({
        title: "Address copied",
        description: `${type} address has been copied to clipboard.`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Please try to copy the address manually.",
        variant: "destructive",
      });
    }
  };

  const handleSendSuggestion = () => {
    if (!suggestion.trim()) {
      toast({
        title: "Empty suggestion",
        description: "Please enter a suggestion before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    // Simulate sending the suggestion
    setTimeout(() => {
      setIsSending(false);
      setSuggestion('');
      setEmail('');
      toast({
        title: "Suggestion received",
        description: "Thank you for your feedback!",
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Support Us</h1>
          <div className="w-[74px]"></div> {/* Spacer for centering */}
        </div>

        <Tabs defaultValue="bitcoin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
            <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bitcoin">
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
                  onClick={() => copyToClipboard(BITCOIN_ADDRESS, 'Bitcoin')}
                >
                  {copied === 'Bitcoin' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy Address
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ethereum">
            <div className="bg-background border rounded-lg p-6 flex flex-col items-center">
              <div className="bg-white p-3 rounded-lg mb-6">
                <img 
                  src="/lovable-uploads/997d3e14-282f-489b-b886-10dee1cb22ab.png" 
                  alt="Ethereum QR Code" 
                  className="w-60 h-60"
                />
              </div>
              
              <h2 className="text-xl font-medium mb-4">Your Ethereum Address</h2>
              
              <div className="w-full bg-muted p-3 rounded-md mb-4 flex items-center">
                <div className="text-xs break-all flex-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {ETHEREUM_ADDRESS}
                </div>
              </div>
              
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(ETHEREUM_ADDRESS, 'Ethereum')}
                >
                  {copied === 'Ethereum' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy Address
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="suggestions">
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Send us your suggestions</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email (optional)</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="suggestion">Your Suggestion</Label>
                  <Textarea 
                    id="suggestion" 
                    placeholder="Share your ideas with us..."
                    className="min-h-[120px]"
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSendSuggestion}
                  disabled={isSending || !suggestion.trim()}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Suggestion
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Thank you for supporting our application. Your contribution helps us continue improving our services.
        </p>
      </div>
    </Layout>
  );
}
