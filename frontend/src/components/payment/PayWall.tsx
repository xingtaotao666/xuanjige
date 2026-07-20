import { useState, useEffect, useRef, type ReactNode } from 'react';
import { LockIcon, RefreshCwIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isUnlocked, markUnlocked } from '@/lib/unlockStore';
import {
  createOrder,
  queryOrder,
  getQrCodeImageUrl,
  hasWorkerUrl,
  type CreateOrderResponse,
} from '@/lib/payment/paymentApi';

type PaymentPhase = 'idle' | 'creating' | 'waiting' | 'success' | 'error';

/**
 * 付费遮挡组件
 *
 * 当配置了 Worker URL（真实微信支付）时：
 *   自动创建订单 → 显示微信支付动态二维码 → 轮询支付状态 → 成功后自动解锁
 *
 * 未配置 Worker URL（离线降级）时：
 *   显示固定收款码图片，用户手动确认支付（无真实验证）
 */
export default function PayWall({
  unlockKey,
  qrCodeUrl = '/qrcode-pay.png',
  price = '0.5',
  label = 'AI 解读已锁定',
  children,
}: {
  unlockKey?: string;
  qrCodeUrl?: string;
  price?: string;
  label?: string;
  children: ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(() => !unlockKey || isUnlocked(unlockKey));
  const [justUnlocked, setJustUnlocked] = useState(false);

  // 线上支付状态
  const [phase, setPhase] = useState<PaymentPhase>('idle');
  const [order, setOrder] = useState<CreateOrderResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const onlineMode = hasWorkerUrl();

  // 创建订单
  const startPayment = async () => {
    if (!unlockKey || !onlineMode) return;
    setPhase('creating');
    setErrorMsg('');
    try {
      const result = await createOrder({ recordKey: unlockKey });
      setOrder(result);
      setPhase('waiting');
    } catch (err: any) {
      setErrorMsg(err.message || '创建订单失败');
      setPhase('error');
    }
  };

  // 轮询支付状态
  useEffect(() => {
    if (phase !== 'waiting' || !order) return;
    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) return;
      try {
        const status = await queryOrder(order.outTradeNo);
        if (status.status === 'SUCCESS') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('success');
          markUnlocked(unlockKey!);
          setUnlocked(true);
          setJustUnlocked(true);
          setTimeout(() => {
            document.getElementById(`paywall-${unlockKey!.slice(0, 16)}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
        setPollCount((c) => c + 1);
      } catch {
        // 网络错误静默，下次轮询重试
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, order, unlockKey]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // 离线模式：直接解锁
  const handleOfflinePay = () => {
    if (!unlockKey) return;
    markUnlocked(unlockKey);
    setUnlocked(true);
    setJustUnlocked(true);
    setTimeout(() => {
      document.getElementById(`paywall-${unlockKey!.slice(0, 16)}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // 没有 unlockKey → 免费展示
  if (unlocked) {
    return (
      <div
        id={unlockKey ? `paywall-${unlockKey.slice(0, 16)}` : undefined}
        className={justUnlocked ? 'animate-rise' : ''}
      >
        {justUnlocked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
            <span>🔓</span>
            已解锁！{onlineMode ? '支付验证通过，' : ''}AI 解读内容如下
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div id={`paywall-${unlockKey!.slice(0, 16)}`} className="relative">
      {/* 子内容模糊预览 */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* 遮挡层 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-bronze/70 p-6 backdrop-blur-[2px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-bronze/40 bg-bronze/10">
          <LockIcon className="h-7 w-7 text-bronze-dark" />
        </div>

        <h3 className="font-kai text-xl text-bronze-dark">{label}</h3>
        <p className="max-w-xs text-center text-sm text-inkstone-soft">
          支付 <span className="font-bold text-bronze-dark">¥{price}</span> 即可解锁完整 AI 解读，
          一次支付永久可看
        </p>

        {onlineMode && phase === 'idle' && (
          <Button
            onClick={startPayment}
            className="bg-bronze px-8 font-kai text-inkstone shadow-paper-md transition hover:bg-bronze/80"
          >
            获取支付二维码
          </Button>
        )}

        {onlineMode && phase === 'creating' && (
          <div className="flex flex-col items-center gap-3">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-bronze-dark" />
            <p className="text-sm text-inkstone-soft">正在创建支付订单…</p>
          </div>
        )}

        {onlineMode && phase === 'waiting' && order && (
          <>
            {/* 微信支付动态二维码 */}
            <div className="rounded-xl border-2 border-bronze/30 bg-white p-2 shadow-lg shadow-bronze/10">
              <img
                src={getQrCodeImageUrl(order.codeUrl)}
                alt="微信支付二维码"
                className="h-44 w-44 object-contain"
              />
            </div>
            <p className="text-xs text-inkstone-soft/70">
              请使用微信扫码支付 <span className="text-bronze-dark">¥{price}</span>
            </p>
            <div className="flex items-center gap-2 text-xs text-inkstone-soft/60">
              <RefreshCwIcon className={`h-3 w-3 ${pollCount > 0 ? 'animate-spin' : ''}`} />
              等待支付中{'.'.repeat((pollCount % 3) + 1)}
            </div>
            <p className="text-[10px] text-inkstone-soft/50">
              订单号：{order.outTradeNo.slice(-8)}
            </p>
          </>
        )}

        {onlineMode && phase === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <AlertTriangleIcon className="h-8 w-8 text-amber-400" />
            <p className="max-w-xs text-center text-xs text-amber-300/80">{errorMsg}</p>
            <Button
              onClick={startPayment}
              variant="outline"
              className="border-bronze/50 text-bronze-dark hover:bg-bronze/10"
            >
              重新获取二维码
            </Button>
          </div>
        )}

        {/* 离线降级模式：固定收款码 + 手动确认 */}
        {!onlineMode && (
          <>
            <div className="rounded-xl border-2 border-bronze/30 bg-white p-2 shadow-lg shadow-bronze/10">
              <img
                src={qrCodeUrl}
                alt="收款码"
                className="h-44 w-44 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div class="flex h-44 w-44 items-center justify-center rounded-lg bg-[#0a0710] text-xs text-inkstone-soft">请上传收款码到 public/qrcode-pay.png</div>';
                  }
                }}
              />
            </div>
            <p className="text-xs text-inkstone-soft/70">
              请使用微信/支付宝扫码支付 <span className="text-bronze-dark">¥{price}</span>
            </p>
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-[10px] text-amber-400/80">
              ⚠️ 离线模式：支付后点击下方按钮手动解锁
            </div>
            <Button
              onClick={handleOfflinePay}
              className="bg-bronze px-8 font-kai text-inkstone shadow-paper-md transition hover:bg-bronze/80"
            >
              我已支付，立即解锁
            </Button>
            <p className="text-[10px] text-inkstone-soft/50">
              支付后点击上方按钮，永久可查看此条结果
            </p>
          </>
        )}
      </div>
    </div>
  );
}
