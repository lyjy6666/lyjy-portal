'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** 最小类型声明，避免依赖浏览器私有类型 */
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionError = { error: string };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => RecognitionLike;

/**
 * 语音输入。
 *
 * 旧版的 onerror / onend 闭包捕获的 isRecording 恒为 false，导致「持续录音」
 * 自动重启是死代码、no-speech 容错失效。这里全部改用 ref。
 * 另外：interimResults 实时预览、不支持时降级为普通输入框、权限只申请一次、不打印作业内容。
 */
export function useVoiceInput(onFinal: (text: string) => void) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef(false);
  const manualStopRef = useRef(false);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      manualStopRef.current = true;
      recordingRef.current = false;
      try { recognitionRef.current?.abort(); } catch { /* 忽略 */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recordingRef.current = false;
    setRecording(false);
    setInterim('');
    try { recognitionRef.current?.stop(); } catch { /* 忽略 */ }
    recognitionRef.current = null;
    // 释放麦克风，否则浏览器会一直显示「正在录音」且不释放设备
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    // 快速双击会连开两个识别实例、把文本追加两遍；启动期间直接忽略重复调用
    if (recordingRef.current || recognitionRef.current) return;
    recordingRef.current = true;
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      recordingRef.current = false;
      setRecording(false);
      return;
    }

    // 权限只申请一次，且不再与 SpeechRecognition 重复申请；保存流以便 stop 时释放
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
    } catch {
      // 浏览器可能不支持独立授权，继续让 SpeechRecognition 自行处理
    }

    const recognition = new Ctor();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) finalRef.current(finalText);
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      // no-speech 不该终止持续录音，静默忽略即可
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stop();
        return;
      }
      if (event.error === 'network') stop();
    };

    recognition.onend = () => {
      setInterim('');
      if (recordingRef.current && !manualStopRef.current) {
        // 真正的持续录音：自动重启（旧版这段是死代码）
        try { recognition.start(); } catch { recordingRef.current = false; setRecording(false); }
      }
    };

    manualStopRef.current = false;
    recordingRef.current = true;
    recognitionRef.current = recognition;
    setRecording(true);
    try { recognition.start(); } catch { stop(); }
  }, [stop]);

  return { supported, recording, interim, start, stop, toggle: () => (recordingRef.current ? stop() : void start()) };
}
