import { useState, type ReactNode } from 'react';
import { LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isUnlocked, markUnlocked } from '@/lib/unlockStore';

/**
 * 付费遮挡组件
 *
 * 当 unlockKey 未解锁时，用毛玻璃效果遮挡子内容，显示付费入口；
 * 解锁后直接展示子内容。
 *
 * @param unlockKey  解锁键（通常由 Section 根据用户输入生成）
 * @param qrCodeUrl  收款码图片 URL，默认 /qrcode-pay.png
 * @param price      显示价格文案，默认 "0.5"
 * @param label      遮挡标题，默认 "AI 解读已锁定"
 * @param children   被遮挡的付费内容
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

  const handlePay = () => {
    if (!unlockKey) return;
    markUnlocked(unlockKey);
    setUnlocked(true);
    setJustUnlocked(true);
    // 解锁后自动滚动到该区域
    setTimeout(() => {
      const el = document.getElementById(`paywall-${unlockKey.slice(0, 16)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // 没有 unlockKey → 免费展示（ShareView 等场景）
  if (unlocked) {
    return (
      <div
        id={unlockKey ? `paywall-${unlockKey.slice(0, 16)}` : undefined}
        className={justUnlocked ? 'animate-rise' : ''}
      >
        {justUnlocked && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-300">
            <span className="text-emerald-300">🔓</span>
            已解锁！AI 解读内容如下
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div
      id={`paywall-${unlockKey!.slice(0, 16)}`}
      className="relative"
    >
      {/* 子内容模糊预览 */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* 遮挡层 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-[#0a0710]/70 p-6 backdrop-blur-[2px]">
        {/* 锁图标 */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-element/40 bg-element/10">
          <LockIcon className="h-7 w-7 text-element" />
        </div>

        {/* 标题 */}
        <h3 className="font-kai text-xl text-gold">{label}</h3>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          支付 <span className="font-bold text-gold">¥{price}</span> 即可解锁完整 AI 解读，
          一次支付永久可看
        </p>

        {/* 收款码区域 */}
        <div className="rounded-xl border-2 border-element/30 bg-white p-2 shadow-lg shadow-element/10">
          <img
            src={qrCodeUrl}
            alt="微信/支付宝收款码"
            className="h-44 w-44 object-contain"
            onError={(e) => {
              // 图片加载失败时显示占位提示
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const placeholder = document.createElement('div');
                placeholder.className =
                  'flex h-44 w-44 items-center justify-center rounded-lg bg-[#0a0710] text-xs text-muted-foreground';
                placeholder.textContent = '请上传您的收款码图片到 public/qrcode-pay.png';
                parent.appendChild(placeholder);
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground/70">
          请使用微信或支付宝扫码支付 ¥{price}
        </p>

        {/* 解锁按钮 */}
        <Button
          onClick={handlePay}
          className="bg-element px-8 font-kai text-void shadow-glow-md transition hover:bg-element/80"
        >
          我已支付，立即解锁
        </Button>
        <p className="text-[10px] text-muted-foreground/50">
          支付后点击上方按钮，解锁后永久可查看此条结果
        </p>
      </div>
    </div>
  );
}
