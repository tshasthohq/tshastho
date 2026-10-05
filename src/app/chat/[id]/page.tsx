"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, User, Stethoscope, Clock } from "lucide-react";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const threadId = params.id as string;

  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isDoctor, setIsDoctor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const res = await fetch(`/api/chat/threads/${threadId}/messages`, { credentials: "include" });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages || []);
    setIsDoctor(data.isDoctor);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !threadId) return;
    load(true);
  }, [user, threadId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!user || !threadId) return;
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [user, threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    const res = await fetch(`/api/chat/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: newMessage }),
    });
    setSending(false);
    if (res.ok) {
      setNewMessage("");
      load(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading...</div>;
  if (!thread) return <div className="p-6 text-center text-slate-500">Thread not found</div>;

  const otherName = isDoctor ? thread.patient?.name : `Dr. ${thread.doctor?.user?.name}`;
  const otherSub = isDoctor ? thread.patient?.phone : thread.doctor?.specialty;
  const otherIcon = isDoctor ? User : Stethoscope;
  const OtherIcon = otherIcon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <OtherIcon className="text-blue-600" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 truncate">{otherName}</div>
          {otherSub && <div className="text-xs text-slate-500 truncate">{otherSub}</div>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-12">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMine ? "bg-blue-600 text-white" : "bg-white text-slate-800 border border-slate-100"
                }`}>
                  {!isMine && (
                    <div className="text-[10px] opacity-75 mb-0.5 font-medium">
                      {m.senderRole === "DOCTOR" ? "Doctor" : "Patient"}
                    </div>
                  )}
                  <div className="text-sm break-words whitespace-pre-wrap">{m.message}</div>
                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMine ? "text-blue-100" : "text-slate-400"}`}>
                    <Clock size={9} />
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMine && m.isRead && <span className="ml-1">✓✓</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-white border-t border-slate-200 p-3 flex gap-2 sticky bottom-0">
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" disabled={sending || !newMessage.trim()}
          className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 flex items-center justify-center">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
