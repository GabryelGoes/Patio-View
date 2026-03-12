
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Vehicle } from './types.ts';

interface VoiceAssistantProps {
  vehicles: Vehicle[];
  onSetPage: (page: number) => void;
  currentPage: number;
  carsPerPage: number;
  soundEnabled: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ vehicles, onSetPage, currentPage, carsPerPage, soundEnabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = 'pt-BR';
      recog.continuous = false;
      recog.interimResults = false;

      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onerror = () => setIsListening(false);
      
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleCommand(transcript);
      };

      setRecognition(recog);
    }
  }, []);

  const speakResponse = async (text: string) => {
    if (!soundEnabled) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Diga de forma curta e profissional: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        // Correção de alinhamento: Criamos um buffer alinhado
        const dataInt16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.byteLength / 2));
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS Error:", e);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setAssistantText(`Ouvido: "${command}"`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const totalPages = Math.ceil(vehicles.length / carsPerPage);
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `O usuário disse: "${command}". 
        Dados atuais: Página atual ${currentPage + 1} de ${totalPages}. 
        Veículos no pátio: ${JSON.stringify(vehicles.map(v => ({p:v.plate, m:v.model, s:v.stage, c:v.client})))}.
        Aja como um assistente de pátio inteligente e resolva a solicitação do usuário.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, description: "Ação a tomar: 'GO_TO_PAGE', 'INFO', 'NONE'" },
              page: { type: Type.NUMBER, description: "Número da página (0-indexed) se a ação for GO_TO_PAGE" },
              voiceResponse: { type: Type.STRING, description: "Resposta curta para falar ao usuário" }
            },
            required: ["action", "voiceResponse"]
          }
        }
      });

      const result = JSON.parse(response.text);
      
      if (result.action === 'GO_TO_PAGE' && result.page !== undefined) {
        onSetPage(Math.min(Math.max(0, result.page), totalPages - 1));
      }

      await speakResponse(result.voiceResponse);
      setAssistantText(result.voiceResponse);
      
      setTimeout(() => setAssistantText(""), 6000);
    } catch (error) {
      console.error("AI Error:", error);
      setAssistantText("Erro ao processar comando.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col items-end gap-4">
      {assistantText && (
        <div className="bg-zinc-900/95 border border-white/10 backdrop-blur-2xl px-6 py-4 rounded-3xl shadow-2xl max-w-xs animate-hero-reveal">
          <p className="text-white font-bold italic text-sm leading-relaxed">{assistantText}</p>
        </div>
      )}
      
      <button 
        onClick={toggleListening}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative shadow-2xl ${
          isListening ? 'bg-blue-600 scale-110 shadow-blue-500/50' : 'bg-zinc-800 hover:bg-zinc-700'
        } ${isProcessing ? 'animate-pulse' : ''}`}
      >
        {isListening && (
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400/30" />
        )}
        <svg viewBox="0 0 24 24" className={`w-8 h-8 fill-current ${isListening ? 'text-white' : 'text-blue-400'}`}>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </button>
      
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mr-2">Assistente RDA</p>
    </div>
  );
};

export default VoiceAssistant;
