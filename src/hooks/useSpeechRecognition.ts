import { useState, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isRecording: boolean;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
}

export function useSpeechRecognition(onResult: (text: string) => void): SpeechRecognitionHook {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('浏览器不支持语音识别，请使用 Chrome');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult(finalTranscript);
      }
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        return;
      }
      setIsRecording(false);
    };
    recognition.onend = () => {
      // Auto-restart if still in recording mode
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore if already started
        }
      }
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [onResult]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return { isRecording, transcript, startRecording, stopRecording, toggleRecording };
}
