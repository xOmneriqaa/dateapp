import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  chatEnded: boolean;
  onTypingChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export function ChatInput({
  newMessage,
  chatEnded,
  onTypingChange,
  onSendMessage,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSendMessage}
      className="border-t-2 border-black px-6 py-4 bg-white"
    >
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder={chatEnded ? "Chat has ended" : "Type a message..."}
          value={newMessage}
          onChange={(e) => onTypingChange(e.target.value)}
          className="flex-1"
          disabled={chatEnded}
        />
        <Button
          type="submit"
          disabled={!newMessage.trim() || chatEnded}
          className="px-6"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
