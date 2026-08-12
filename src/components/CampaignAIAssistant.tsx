import { useState, useRef, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Send, Bot, User, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { AUTH_TOKEN_KEY, getApiBaseUrl } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CampaignAIAssistantProps {
  onApplyData: (data: any) => void;
}

export function CampaignAIAssistant({ onApplyData }: CampaignAIAssistantProps) {
  const { getToken } = useClerkAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your Crevio Campaign Assistant. Tell me what kind of campaign you want to run, and I'll help you fill out the details!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingData]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setPendingData(null);

    try {
      let token = await getToken();
      if (!token) {
        token = localStorage.getItem(AUTH_TOKEN_KEY);
      }

      // Convert our message history format to OpenAI format
      const openaiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch(`${getApiBaseUrl()}/api/campaigns/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: openaiMessages })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      if (data.suggestedFields && Object.keys(data.suggestedFields).length > 0) {
        setPendingData(data.suggestedFields);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error processing that request. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (pendingData) {
      onApplyData(pendingData);
      setPendingData(null);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] border-primary/20 shadow-lg shadow-primary/5 bg-card/80 backdrop-blur-sm">
      <div className="p-4 border-b border-border/50 flex items-center gap-2 bg-muted/30 rounded-t-xl">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Crevio Campaign AI</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">GPT-4o Agent</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-primary" />}
              </div>
              <div className={`text-sm p-3 rounded-2xl max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-muted border border-border/50 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted border border-border text-foreground flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="text-sm p-3 rounded-2xl bg-muted border border-border/50 rounded-tl-sm flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150"></span>
              </div>
            </div>
          )}

          {pendingData && !isLoading && (
            <div className="ml-11 mr-4 mt-2 p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <Wand2 className="w-3.5 h-3.5" /> Generated Campaign Data
              </div>
              <div className="text-xs text-muted-foreground font-mono space-y-2 mt-3">
                {Object.entries(pendingData).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  return (
                    <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <span className="text-foreground/80 w-32 shrink-0 font-semibold">{key}:</span>
                      <span className="break-words text-foreground/90 whitespace-pre-wrap">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </div>
                  );
                })}
              </div>
              <Button size="sm" onClick={handleApply} className="w-full mt-4 h-9 text-sm font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                Apply Fields to Form
              </Button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 bg-background/50 rounded-b-xl">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. Create a ₹50k Instagram Reel campaign for gamers..."
            className="flex-1 bg-background"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
