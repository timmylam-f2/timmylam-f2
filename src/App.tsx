/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Lightbulb, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type RelationshipState = 'disjoint' | 'external_tangent' | 'intersecting' | 'internal_tangent' | 'contained' | 'concentric';

const STATE_NAMES: Record<RelationshipState, string> = {
  disjoint: "外離",
  external_tangent: "外切",
  intersecting: "相交",
  internal_tangent: "內切",
  contained: "內含",
  concentric: "同心圓"
};

const MATH_NAMES: Record<RelationshipState, string> = {
  disjoint: "d > R + r",
  external_tangent: "d = R + r",
  intersecting: "R - r < d < R + r",
  internal_tangent: "d = R - r",
  contained: "0 < d < R - r",
  concentric: "d = 0"
};

export default function App() {
  const [r1, setR1] = useState(0);
  const [r2, setR2] = useState(0);
  const [d, setD] = useState(0);
  const [correctState, setCorrectState] = useState<RelationshipState>('disjoint');
  const [userMath, setUserMath] = useState<string>('');
  const [userState, setUserState] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getRandomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateQuestion = useCallback(() => {
    setShowResult(false);
    setUserMath('');
    setUserState('');
    
    const stateKeys: RelationshipState[] = ['disjoint', 'external_tangent', 'intersecting', 'internal_tangent', 'contained', 'concentric'];
    const stateType = stateKeys[getRandomInt(0, 5)];
    
    let R1 = getRandomInt(15, 45);
    let R2 = getRandomInt(15, 45);
    
    // Ensure internal tangent and contained don't become concentric by accident
    if (stateType === 'internal_tangent' || stateType === 'contained') {
      while (R1 === R2) {
        R2 = getRandomInt(15, 45);
      }
    }

    const R = Math.max(R1, R2);
    const r = Math.min(R1, R2);
    let dist = 0;

    switch (stateType) {
      case 'disjoint': dist = R + r + getRandomInt(10, 30); break;
      case 'external_tangent': dist = R + r; break;
      case 'intersecting': dist = getRandomInt(R - r + 2, R + r - 2); break;
      case 'internal_tangent': dist = R - r; break;
      case 'contained': dist = getRandomInt(2, R - r - 2); break;
      case 'concentric': dist = 0; break;
    }

    setR1(R1);
    setR2(R2);
    setD(dist);
    setCorrectState(stateType);
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const drawCircles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxDistanceNeeded = d + r1 + r2;
    let scale = Math.min(
      (canvas.width - 60) / maxDistanceNeeded, 
      (canvas.height - 60) / (Math.max(r1, r2) * 2)
    );
    if (scale > 4) scale = 4;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Center the system of two circles
    const cx1 = centerX - (d * scale) / 2;
    const cx2 = centerX + (d * scale) / 2;

    // Circle 1 (Green)
    ctx.beginPath();
    ctx.arc(cx1, centerY, r1 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();

    // Center 1
    ctx.beginPath();
    ctx.arc(cx1, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#064e3b";
    ctx.fill();
    ctx.font = "12px sans-serif";
    ctx.fillText("C₁", cx1 - 15, centerY - 10);

    // Circle 2 (Red)
    ctx.beginPath();
    ctx.arc(cx2, centerY, r2 * scale, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ef4444";
    ctx.stroke();

    // Center 2
    ctx.beginPath();
    ctx.arc(cx2, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#7f1d1d";
    ctx.fill();
    ctx.fillText("C₂", cx2 + 5, centerY - 10);

    // Line between centers
    if (d > 0) {
      ctx.beginPath();
      ctx.moveTo(cx1, centerY);
      ctx.lineTo(cx2, centerY);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label distance d
      ctx.fillStyle = "#374151";
      ctx.fillText(`d=${d}`, (cx1 + cx2) / 2 - 10, centerY + 15);
    }
  }, [d, r1, r2]);

  useEffect(() => {
    if (showResult) {
      drawCircles();
    }
  }, [showResult, drawCircles]);

  const handleSubmit = () => {
    if (!userMath || !userState) {
      return;
    }

    const mathCorrect = userMath === correctState;
    const stateCorrect = userState === correctState;
    setIsCorrect(mathCorrect && stateCorrect);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Circle className="absolute -top-10 -left-10 w-40 h-40" />
            <Circle className="absolute -bottom-10 -right-10 w-60 h-60" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">兩圓位置關係挑戰</h1>
          <p className="text-slate-400 text-sm">觀察數據，判斷圓與圓之間的關係</p>
        </div>

        <div className="p-8">
          {/* Info Panel */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: '圓 1 半徑', sub: 'R₁', val: r1, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: '圓 2 半徑', sub: 'R₂', val: r2, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: '圓心距', sub: 'd', val: d, color: 'text-blue-600', bg: 'bg-blue-50' }
            ].map((item, i) => (
              <div key={i} className={`${item.bg} p-4 rounded-2xl text-center border border-white/50 shadow-sm`}>
                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60 block mb-1">
                  {item.label} <span className="italic font-serif">({item.sub})</span>
                </span>
                <strong className={`text-3xl font-bold ${item.color}`}>{item.val}</strong>
              </div>
            ))}
          </div>

          {!showResult ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl text-xs">
                <Lightbulb size={16} className="text-amber-500" />
                <span>提示：設大圓半徑為 R，小圓半徑為 r</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">1. 圓心距與半徑的關係為：</label>
                  <select 
                    value={userMath}
                    onChange={(e) => setUserMath(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>請選擇不等式/等式關係</option>
                    {Object.entries(MATH_NAMES).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">2. 兩圓的位置關係為：</label>
                  <select 
                    value={userState}
                    onChange={(e) => setUserState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>請選擇位置關係</option>
                    {Object.entries(STATE_NAMES).map(([key, val]) => (
                      <option key={key} value={key}>{val}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!userMath || !userState}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200"
              >
                確認答案並繪圖
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                {isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <div>
                  <h2 className="font-bold text-lg">{isCorrect ? '🎉 答對了！' : '❌ 答錯囉！'}</h2>
                  <p className="text-sm opacity-80">
                    {isCorrect 
                      ? `完全正確！大圓 R=${Math.max(r1, r2)}, 小圓 r=${Math.min(r1, r2)}` 
                      : `正解：${MATH_NAMES[correctState]} (${STATE_NAMES[correctState]})`
                    }
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-2 overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={240} 
                  className="w-full h-auto block"
                />
              </div>

              <button 
                onClick={generateQuestion}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
              >
                <RefreshCw size={20} />
                🎲 下一題
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
