"use client";

import { useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { parseVoiceInput } from "@/lib/voice/parser";

interface Props {
  onParsed: (result: { medicineName: string; quantity: number; unit?: string }) => void;
}

export default function VoiceInputButton({ onParsed }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [parsed, setParsed] = useState<any>(null);

  const { isListening, isSupported, transcript, start, stop, toggle } = useVoiceInput({
    language: "bn-BD",
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        const result = parseVoiceInput(text);
        setParsed(result);
      }
    },
  });

  const handleConfirm = () => {
    if (parsed && parsed.medicineName.trim()) {
      onParsed({
        medicineName: parsed.medicineName,
        quantity: parsed.quantity,
        unit: parsed.unit,
      });
    }
    setShowModal(false);
    setParsed(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-1 bg-purple-50 text-purple-600 px-3 py-2 rounded-xl text-xs font-medium hover:bg-purple-100"
        title="Voice input (Bengali)"
      >
        <Mic size={14} /> Voice
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">🎤 Voice Input</h2>
              <button onClick={() => { stop(); setShowModal(false); setParsed(null); }}>
                <X size={20} />
              </button>
            </div>

            {!isSupported ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                Voice input not supported. Please use Chrome, Edge, or Safari.
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <button
                    type="button"
                    onClick={toggle}
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition ${
                      isListening ? "bg-red-500 animate-pulse" : "bg-purple-600"
                    }`}
                  >
                    {isListening ? (
                      <MicOff size={36} className="text-white" />
                    ) : (
                      <Mic size={36} className="text-white" />
                    )}
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    {isListening ? "শুনছি... কথা বলুন" : "ট্যাপ করে বলুন"}
                  </p>
                </div>

                {transcript && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <div className="text-[10px] text-slate-500 mb-1">You said:</div>
                    <div className="text-sm text-slate-800">{transcript}</div>
                  </div>
                )}

                {parsed && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 space-y-2">
                    <div className="text-[10px] text-green-700 font-medium">Parsed:</div>
                    <div className="text-sm">
                      <span className="text-slate-500">Medicine:</span>{" "}
                      <strong>{parsed.medicineName || "(empty)"}</strong>
                    </div>
                    <div className="text-sm">
                      <span className="text-slate-500">Quantity:</span>{" "}
                      <strong>{parsed.quantity}</strong>
                      {parsed.unit && ` ${parsed.unit}`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Confidence: {(parsed.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-2 mb-3 text-[10px] text-blue-700">
                  💡 উদাহরণ: "প্যারাসিটামল দুই পিস" বা "Napa 500mg তিন"
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setParsed(null); }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!parsed || !parsed.medicineName.trim()}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium disabled:opacity-50"
                  >
                    Add to Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
