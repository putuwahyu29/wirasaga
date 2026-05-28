import React, { useState, useEffect, useRef } from 'react';

interface ChatModalProps {
  onClose: () => void;
}

export default function ChatModal({ onClose }: ChatModalProps) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Halo. Saya Asisten AI Wirasaga. Ada yang bisa saya bantu terkait keselamatan atau darurat hari ini?' },
    { id: 2, sender: 'user', text: 'Bagaimana cara menangani luka bakar ringan?' },
    { id: 3, sender: 'agent', text: 'Untuk luka bakar ringan (derajat 1), ikuti langkah ini:\n1. Bilas dengan air mengalir (bukan es) selama 10-15 menit.\n2. Lepaskan perhiasan atau pakaian ketat di area tersebut sebelum membengkak.\n3. Oleskan losion lidah buaya atau salep luka bakar.\n4. Tutup dengan kasa steril longgar jika perlu.', hasWarning: true, warningText: 'Jika luka lebih besar dari 8cm atau mengenai wajah, segera cari bantuan medis.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [SpeechRecognition]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!SpeechRecognition) {
        alert("Browser Anda tidak mendukung fitur pengenalan suara.");
        return;
      }
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if ((!text.trim() && !attachedImage) || isLoading) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
    }

    const currentImage = attachedImage;
    const newMsg = { id: Date.now(), sender: 'user', text: text.trim(), image: currentImage };
    // We must spread prev, otherwise it might complain about type
    setMessages(prev => [...prev, newMsg]);
    setInputVal('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text.trim(), locationContext: 'Surabaya', imageBase64: currentImage })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'agent', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'agent', text: 'Maaf, terjadi kesalahan atau koneksi terputus.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'agent', text: 'Koneksi ke server terputus.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="bg-white dark:bg-zinc-950 text-neutral-900 dark:text-zinc-50 h-full flex flex-col overflow-hidden animate-fade-in absolute inset-0 z-50">
      <div className="flex flex-col w-full h-full max-w-lg mx-auto bg-white dark:bg-zinc-950 relative">
        {/* TopAppBar */}
        <header className="bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white flex justify-between items-center w-full px-4 py-3 sticky top-0 z-50 border-b border-neutral-150 dark:border-zinc-800/85">
          <button 
            onClick={onClose}
            aria-label="Back" 
            className="flex items-center justify-center p-2 -ml-2 rounded-full text-neutral-600 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-title-lg font-title-lg font-bold flex-1 text-center pr-8 shadow-text text-neutral-900 dark:text-white">Asisten AI</h1>
        </header>

        {/* Chat Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 z-0 bg-neutral-50 dark:bg-zinc-950">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : ''}`}>
              
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm mt-1 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
              )}
              
              <div className={`p-4 shadow-sm border ${
                msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm border-emerald-500/20' 
                  : 'bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-sm border-neutral-200 dark:border-zinc-800'
              } flex flex-col gap-2`}>
                
                <div className={`text-body-md font-body-md whitespace-pre-line ${msg.sender === 'user' ? 'text-white' : 'text-neutral-900 dark:text-zinc-100'}`}>
                  {msg.image && (
                    <img src={msg.image} alt="User attachment" className="w-full max-w-[200px] h-auto rounded-xl shadow-sm mb-2 object-cover border border-white/20" />
                  )}
                  {msg.text}
                </div>
                
                {msg.hasWarning && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl flex gap-2 items-start border border-red-200 dark:border-red-900/40">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px] mt-0.5 shrink-0">warning</span>
                    <p className="text-[11px] font-bold text-red-800 dark:text-red-350 leading-relaxed">{msg.warningText}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 self-start max-w-[85%] mt-1 ml-10">
               <span className="material-symbols-outlined animate-spin text-emerald-600 dark:text-emerald-400">autorenew</span>
               <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400">Asisten sedang mengetik...</span>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </main>

        {/* Bottom Input Area */}
        <div className="bg-white dark:bg-zinc-900 border-t border-neutral-200 dark:border-zinc-800 p-4 pb-safe flex flex-col gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)] z-40 relative">
          
          {/* Quick Action Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['Laporkan Kejadian', 'Panduan P3K', 'Info Cuaca'].map((chip) => (
              <button 
                key={chip}
                onClick={() => handleQuickAction(chip)}
                className="whitespace-nowrap px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full text-xs font-bold text-neutral-700 dark:text-zinc-300 transition-colors border border-neutral-200 dark:border-zinc-700 shadow-sm active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>
          
          {attachedImage && (
            <div className="relative self-start mb-2 animate-fade-in group">
              <img src={attachedImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-500/20 shadow-sm" />
              <button 
                onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          
          {/* Input Field */}
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attachment" 
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">add_circle</span>
            </button>
            
            <div className={`flex-1 bg-neutral-50 dark:bg-zinc-950 rounded-full px-4 py-2 flex items-center border ${isListening ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-neutral-200 dark:border-zinc-800 focus-within:border-emerald-500'} focus-within:bg-white dark:focus-within:bg-zinc-950 transition-all shadow-inner`}>
              <input 
                value={isListening ? (inputVal || 'Mendengarkan...') : inputVal}
                onChange={(e) => !isListening && setInputVal(e.target.value)}
                onKeyDown={(e) => !isListening && e.key === 'Enter' && sendMessage(inputVal)}
                className="w-full bg-transparent border-none focus:ring-0 text-xs font-semibold p-1.5 outline-none text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500" 
                placeholder={attachedImage ? "Tambahkan deskripsi..." : "Ketik atau ucapkan pesan..."} 
                type="text" 
                disabled={isListening}
              />
              <button 
                disabled={(!inputVal.trim() && !attachedImage) || isLoading}
                onClick={() => sendMessage(inputVal)}
                aria-label="Send" 
                className={`ml-2 flex items-center justify-center transition-colors p-1.5 rounded-full ${(inputVal.trim() || attachedImage) && !isLoading ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/35' : 'text-neutral-300 dark:text-zinc-700'}`}
              >
                <span className="material-symbols-outlined filled" style={(inputVal.trim() || attachedImage) ? { fontVariationSettings: "'FILL' 1" } : {}}>send</span>
              </button>
            </div>
            
            <button 
              onClick={toggleListening}
              aria-label="Voice Input" 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all flex-shrink-0 ${isListening ? 'bg-rose-600 scale-105 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}`}
            >
              <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isListening ? "stop" : "mic"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
