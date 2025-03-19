import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type VoiceContextType = {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  transcript: string;
  lastCommand: string | null;
  isSpeaking: boolean;
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

type VoiceProviderProps = {
  children: ReactNode;
};

export const VoiceProvider = ({ children }: VoiceProviderProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const processCommand = (command: string) => {
    setLastCommand(command);
    
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand.includes('compose')) {
      navigate('/compose');
    } else if (lowerCommand.includes('inbox')) {
      navigate('/');
    } else if (lowerCommand.includes('settings')) {
      navigate('/settings');
    } else if (lowerCommand.includes('logout') || lowerCommand.includes('sign out')) {
      speak('Are you sure you want to log out? Say yes to confirm');
    } else if (lowerCommand.includes('read email')) {
      speak('Which email would you like to read?');
    } else if (lowerCommand.includes('delete email')) {
      speak('Which email would you like to delete?');
    }
  };

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;   
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          processCommand(transcript);
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.error('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition, processCommand]);
  
  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        speak('Voice commands activated');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };
  
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      speak('Voice commands deactivated');
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (user?.preferences?.voiceSpeed) {
        utterance.rate = user.preferences.voiceSpeed;
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported in this browser');
    }
  };
  
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  const value = {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    transcript,
    lastCommand,
    isSpeaking
  };
  
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default VoiceProvider; 