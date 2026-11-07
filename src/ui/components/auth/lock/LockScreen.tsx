import React, { useState, useEffect, useRef, useCallback } from 'react';
import ipc from '@/lib/ipc';
import { Spinner } from '@/components/common/PageLoading';
import { LockIcon } from '@/components/common/icons';

interface Props {
  onUnlock: () => void;
}

type Screen = 'password' | 'recovery' | 'resetPassword';

/** Hiệu ứng mưa mã nhị phân Matrix (0, 1) sống động, tốc độ trôi êm đềm, tối ưu CPU */
const MatrixRain = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 18;
    let columns = Math.floor(width / fontSize);
    // Ký tự nhị phân 0, 1 chủ đạo, xen kẽ ký tự số
    const chars = '010101010101011001010123456789';
    let drops = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -100));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -100));
    };
    window.addEventListener('resize', handleResize);

    let lastTime = 0;
    // Chạy ở nhịp ~16-18 fps để số rơi chậm rãi, thư thái, huyền bí chuẩn Matrix
    const fps = 16;
    const interval = 1000 / fps;

    const draw = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(draw);
      const delta = currentTime - lastTime;
      if (delta < interval) return;
      lastTime = currentTime - (delta % interval);

      // Làm mờ dần các frame trước để tạo vệt đuôi rơi (trail effect)
      ctx.fillStyle = 'rgba(2, 6, 3, 0.16)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `bold ${fontSize}px "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Ký tự đầu sáng trắng/xanh chói lóa (head glow), các ký tự sau màu xanh matrix
        const isHead = Math.random() > 0.88;
        if (isHead) {
          ctx.fillStyle = '#f0fdf4'; // Trắng xanh chói lóa
          ctx.shadowColor = '#4ade80';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = '#22c55e'; // Xanh lá matrix neon
          ctx.shadowColor = '#15803d';
          ctx.shadowBlur = 4;
        }

        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-85"
      style={{ filter: 'contrast(1.2) brightness(1.15)' }}
    />
  );
});

export default function LockScreen({ onUnlock }: Props) {
  const [screen, setScreen] = useState<Screen>('password');
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Chế độ nhập: 'otp' (từng ô OTP số) hoặc 'text' (ô nhập bình thường)
  const [codeLength, setCodeLength] = useState<number>(4);
  const [inputMode, setInputMode] = useState<'otp' | 'text'>('otp');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);

  const inputRef = useRef<HTMLInputElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Check cooldown and codeLength on mount
  useEffect(() => {
    ipc.lockScreen.status().then(res => {
      if (res.isCoolingDown && res.remainingCooldown) {
        setCooldown(res.remainingCooldown);
      }
      if (res.codeLength && res.codeLength >= 4 && res.codeLength <= 8) {
        setCodeLength(res.codeLength);
        setOtp(new Array(res.codeLength).fill(''));
      }
    });
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus input on mount and screen change
  useEffect(() => {
    const t = setTimeout(() => {
      if (screen === 'password') {
        if (inputMode === 'otp') {
          otpInputsRef.current[0]?.focus();
        } else {
          inputRef.current?.focus();
        }
      } else {
        inputRef.current?.focus();
      }
    }, 120);
    return () => clearTimeout(t);
  }, [screen, inputMode]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleVerify = useCallback(async (pwdToVerify?: string) => {
    const finalPassword = typeof pwdToVerify === 'string' ? pwdToVerify : (inputMode === 'otp' ? otp.join('') : password);
    if (!finalPassword.trim() || loading || cooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await ipc.lockScreen.verify({ password: finalPassword.trim() });
      if (res.success) {
        onUnlock();
      } else {
        setError(res.error || 'Sai mã bảo vệ');
        triggerShake();
        if (res.cooldownRemaining && res.cooldownRemaining > 0) {
          setCooldown(res.cooldownRemaining);
        }
        setPassword('');
        setOtp(new Array(codeLength).fill(''));
        if (inputMode === 'otp') {
          otpInputsRef.current[0]?.focus();
        } else {
          inputRef.current?.focus();
        }
      }
    } catch {
      setError('Lỗi xác thực hệ thống');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [password, otp, inputMode, codeLength, loading, cooldown, onUnlock]);

  // Xử lý nhập từng ô OTP
  const handleOtpChange = (index: number, val: string) => {
    setError('');
    const newOtp = [...otp];

    // Xử lý khi paste nhiều ký tự vào 1 ô
    if (val.length > 1) {
      const chars = val.slice(0, codeLength).split('');
      for (let i = 0; i < codeLength; i++) {
        newOtp[i] = chars[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(chars.length, codeLength - 1);
      otpInputsRef.current[nextIndex]?.focus();
      if (chars.length === codeLength) {
        void handleVerify(chars.join(''));
      }
      return;
    }

    newOtp[index] = val;
    setOtp(newOtp);

    // Khi gõ 1 ký tự, tự động nhảy sang ô kế tiếp
    if (val && index < codeLength - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Nếu đã nhập đủ số ký tự theo codeLength -> tự động verify ngay lập tức
    const fullOtp = newOtp.join('');
    if (fullOtp.length === codeLength && !newOtp.includes('')) {
      void handleVerify(fullOtp);
    }
  };

  // Xử lý phím đặc biệt trong ô OTP: Backspace, mũi tên trái/phải
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Nếu ô hiện tại rỗng, lùi về ô trước và xoá
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < codeLength - 1) {
      otpInputsRef.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const entered = otp.join('');
      if (entered.length === codeLength) {
        void handleVerify(entered);
      }
    }
  };

  const handleRecoveryVerify = useCallback(async () => {
    if (!recoveryKey.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await ipc.lockScreen.verifyRecovery({ recoveryKey: recoveryKey.trim() });
      if (res.success) {
        setScreen('resetPassword');
        setError('');
      } else {
        setError(res.error || 'Mã khôi phục không đúng');
        triggerShake();
      }
    } catch {
      setError('Lỗi xác thực mã khôi phục');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [recoveryKey, loading]);

  const handleResetPassword = useCallback(async () => {
    if (loading) return;
    if (newPassword.length < 4) {
      setError('Mã mới phải có ít nhất 4 ký tự');
      triggerShake();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mã xác nhận không khớp');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await ipc.lockScreen.resetPassword({
        recoveryKey: recoveryKey.trim(),
        newPassword,
      });
      if (res.success) {
        onUnlock();
      } else {
        setError(res.error || 'Đặt lại mã bảo vệ thất bại');
        triggerShake();
      }
    } catch {
      setError('Lỗi đặt lại mã bảo vệ');
      triggerShake();
    } finally {
      setLoading(false);
    }
  }, [newPassword, confirmPassword, recoveryKey, loading, onUnlock]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (screen === 'password') void handleVerify();
      else if (screen === 'recovery') void handleRecoveryVerify();
      else if (screen === 'resetPassword') void handleResetPassword();
    }
  };

  const activePasswordLength = inputMode === 'otp' ? otp.filter(Boolean).length : password.trim().length;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-[#010402] select-none">
      <style>{`
        @keyframes matrixPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 50px rgba(34, 197, 94, 0.55), inset 0 0 30px rgba(34, 197, 94, 0.2); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .matrix-card-glow {
          animation: matrixPulse 4s ease-in-out infinite;
        }
        .matrix-shake {
          animation: shake 0.4s ease-in-out;
        }
        .matrix-scanline-effect {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
          background-size: 100% 3px, 6px 100%;
        }
      `}</style>

      {/* Hiệu ứng Matrix Digital Rain sống động */}
      <MatrixRain />

      {/* Lớp CRT scanline mờ tạo chiều sâu cyberpunk */}
      <div className="absolute inset-0 pointer-events-none matrix-scanline-effect opacity-30 z-0" />

      {/* ── Khung nhập mật khẩu chính ────────────────────────────── */}
      <div className={`relative z-10 w-full max-w-lg mx-4 ${isShaking ? 'matrix-shake' : ''}`}>
        {/* Header Icon + Tên ứng dụng */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            {/* Glow xanh neon */}
            <div className="absolute w-28 h-28 bg-emerald-500/30 rounded-full blur-2xl" />
            <div
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 border-emerald-400/60 shadow-[0_0_35px_rgba(16,185,129,0.5)]"
              style={{
                background: 'linear-gradient(135deg, rgba(6,78,59,0.85), rgba(2,44,20,0.95))',
              }}
            >
              <svg className="w-10 h-10 text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-widest uppercase font-mono"
            style={{ textShadow: '0 0 25px rgba(52,211,153,0.8), 0 0 50px rgba(16,185,129,0.5)' }}
          >
            DEPLAO LOCK
          </h1>
          <p className="text-white text-sm sm:text-base mt-1.5 font-mono tracking-wider uppercase font-semibold">
            Hệ thống đã khoá • Nhập mã để tiếp tục
          </p>
        </div>

        {/* Khung kính Matrix Cyberpunk với nền đen sâu, độ tương phản cao */}
        <div
          className="relative rounded-2xl p-6 sm:p-8 matrix-card-glow shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(2, 10, 5, 0.96) 0%, rgba(1, 6, 3, 0.98) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(52, 211, 153, 0.55)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(16,185,129,0.25)',
          }}
        >
          {/* Vạch phát sáng rực rỡ trên đỉnh card */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

          {screen === 'password' && (
            <>
              {/* Header của form nhập OTP */}
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                  {inputMode === 'otp' ? `Mã số bảo vệ (${codeLength} số)` : 'Mật khẩu'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-2.5 py-1 text-xs font-mono font-semibold text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-lg transition-colors"
                  >
                    {showPassword ? 'Ẩn mã' : 'Hiện mã'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode(inputMode === 'otp' ? 'text' : 'otp');
                      setError('');
                    }}
                    className="px-2.5 py-1 text-xs font-mono font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-lg transition-colors"
                    title={inputMode === 'otp' ? 'Chuyển sang gõ chữ' : 'Chuyển sang các ô OTP'}
                  >
                    {inputMode === 'otp' ? 'Gõ chữ' : 'Ô OTP'}
                  </button>
                </div>
              </div>

              {/* Chế độ 1: Các ô vuông nhập OTP */}
              {inputMode === 'otp' ? (
                <>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 my-3">
                    {otp.map((val, idx) => {
                      const isFilled = !!val;
                      return (
                        <input
                          key={idx}
                          ref={el => (otpInputsRef.current[idx] = el)}
                          type={showPassword ? 'text' : 'password'}
                          maxLength={codeLength}
                          value={val}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          disabled={loading || cooldown > 0}
                          className={`w-12 sm:w-14 h-16 sm:h-18 text-center text-2xl sm:text-3xl font-black font-mono rounded-xl focus:outline-none transition-all duration-200 ${
                            isFilled
                              ? 'bg-emerald-950/90 text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                              : 'bg-black/90 text-white border-2 border-emerald-500/40 hover:border-emerald-400 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          autoComplete="off"
                          inputMode="numeric"
                        />
                      );
                    })}
                  </div>
                  <p className="text-center text-xs font-mono text-emerald-300/80 mt-1 mb-2">
                    Mã PIN gồm {codeLength} chữ số • Tự động mở khoá khi nhập đủ
                  </p>
                </>
              ) : (
                /* Chế độ 2: Ô nhập văn bản truyền thống - Canh giữa */
                <div className="relative my-3">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập mã bảo vệ..."
                    disabled={loading || cooldown > 0}
                    className="w-full px-4 py-3.5 rounded-xl bg-black/90 text-white font-mono text-xl font-bold text-center tracking-widest placeholder-white/30 border-2 border-emerald-500/50 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.5)] focus:outline-none disabled:opacity-40 transition-all duration-200"
                    autoComplete="off"
                  />
                </div>
              )}

              {/* Thông báo lỗi */}
              {error && (
                <p className="mt-3 text-sm font-mono font-semibold text-red-400 flex items-center gap-1.5 animate-in fade-in">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              {/* Đếm ngược Cooldown khi nhập sai nhiều lần */}
              {cooldown > 0 && (
                <p className="mt-3 text-sm font-mono font-semibold text-amber-300 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tạm khoá bảo vệ. Thử lại sau {cooldown} giây
                </p>
              )}

              {/* Nút bấm Mở khoá */}
              <button
                onClick={() => void handleVerify()}
                disabled={activePasswordLength < 4 || loading || cooldown > 0}
                className="w-full mt-6 py-3.5 text-black font-mono font-black text-base tracking-widest uppercase rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(52,211,153,0.8)] hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                  boxShadow: '0 0 25px rgba(16,185,129,0.4)',
                }}
              >
                {loading ? (
                  <Spinner size={5} />
                ) : (
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
                {loading ? 'ĐANG GIẢI MÃ...' : 'MỞ KHOÁ HỆ THỐNG'}
              </button>

              {/* Nút Quên mật khẩu */}
              <button
                onClick={() => { setScreen('recovery'); setError(''); setRecoveryKey(''); }}
                className="w-full mt-4 text-sm font-mono font-medium text-emerald-300 hover:text-white transition-colors text-center"
              >
                [ Quên mã bảo vệ? ]
              </button>
            </>
          )}

          {/* ── Màn hình Recovery Key ────────────────────────── */}
          {screen === 'recovery' && (
            <>
              <button
                onClick={() => { setScreen('password'); setError(''); }}
                className="flex items-center gap-1.5 text-sm font-mono font-semibold text-emerald-300 hover:text-white transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </button>

              <h2 className="text-lg font-mono font-bold text-white mb-1.5">Mã khôi phục Recovery Key</h2>
              <p className="text-sm text-white/70 font-mono mb-4">
                Nhập mã khôi phục 24 ký tự đã lưu khi thiết lập.
              </p>

              <label className="block text-sm font-mono font-bold text-white mb-2 tracking-wide uppercase">Mã khôi phục</label>
              <input
                ref={inputRef}
                type="text"
                value={recoveryKey}
                onChange={e => { setRecoveryKey(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl bg-black/90 text-white font-mono text-base font-bold text-center tracking-widest placeholder-white/30 border-2 border-emerald-500/50 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.5)] focus:outline-none disabled:opacity-40 transition-all duration-200"
                autoComplete="off"
              />

              {error && (
                <p className="mt-3 text-sm font-mono font-semibold text-red-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleRecoveryVerify}
                disabled={!recoveryKey.trim() || loading}
                className="w-full mt-6 py-3.5 text-black font-mono font-black text-base tracking-widest uppercase rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(52,211,153,0.8)] hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  boxShadow: '0 0 25px rgba(16,185,129,0.4)',
                }}
              >
                {loading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN MÃ KHÔI PHỤC'}
              </button>
            </>
          )}

          {/* ── Màn hình Đặt lại mật khẩu ───────────────────── */}
          {screen === 'resetPassword' && (
            <>
              <h2 className="text-lg font-mono font-bold text-white mb-1.5">Thiết lập mã mới</h2>
              <p className="text-sm text-emerald-300 font-mono mb-4 flex items-center gap-1.5 font-medium">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mã khôi phục hợp lệ. Hãy đặt mã bảo vệ mới.
              </p>

              <label className="block text-sm font-mono font-bold text-white mb-2 tracking-wide uppercase">Mã mới (tối thiểu 4 ký tự)</label>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                placeholder="Nhập mã mới..."
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-black/90 text-white font-mono text-base font-bold text-center tracking-widest placeholder-white/30 border-2 border-emerald-500/50 focus:border-emerald-400 focus:outline-none mb-4 transition-all duration-200"
                autoComplete="new-password"
              />

              <label className="block text-sm font-mono font-bold text-white mb-2 tracking-wide uppercase">Xác nhận mã mới</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Nhập lại mã mới..."
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-black/90 text-white font-mono text-base font-bold text-center tracking-widest placeholder-white/30 border-2 border-emerald-500/50 focus:border-emerald-400 focus:outline-none transition-all duration-200"
                autoComplete="new-password"
              />

              <label className="flex items-center gap-2 mt-3 text-sm font-mono text-white/80 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
                Hiện mã
              </label>

              {error && (
                <p className="mt-3 text-sm font-mono font-semibold text-red-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleResetPassword}
                disabled={!newPassword || !confirmPassword || loading}
                className="w-full mt-6 py-3.5 text-black font-mono font-black text-base tracking-widest uppercase rounded-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(52,211,153,0.8)] hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  boxShadow: '0 0 25px rgba(16,185,129,0.4)',
                }}
              >
                {loading ? 'ĐANG CẬP NHẬT...' : 'LƯU MÃ BẢO VỆ MỚI'}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/70 text-xs font-mono mt-6 tracking-wider font-medium">
          <LockIcon className="w-4 h-4 inline mr-1 text-emerald-400" />
          MÃ HOÁ CỤC BỘ • CÁC TÀI KHOẢN VẪN HOẠT ĐỘNG NGẦM
        </p>
      </div>
    </div>
  );
}
