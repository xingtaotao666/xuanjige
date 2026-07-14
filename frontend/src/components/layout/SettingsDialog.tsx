import { useState, useEffect } from 'react';
import { SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getApiKey, setApiKey, hasApiKey } from '@/lib/llm/deepseek';
import {
  getWorkerUrl,
  setWorkerUrl,
  hasWorkerUrl,
} from '@/lib/payment/paymentApi';

/**
 * 设置面板：配置 DeepSeek API Key 和 支付 Worker 地址。
 * Key 仅保存在浏览器 localStorage（优先级高于构建期注入的 VITE_DEEPSEEK_API_KEY），
 * 未配置时 AI 解读自动降级为规则式，不影响排盘/起卦核心功能。
 *
 * Worker URL 配置后启用真实微信支付验证；未配置时使用离线降级模式。
 */
export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [workerUrl, setWorkerUrlLocal] = useState('');
  const [workerConfigured, setWorkerConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getApiKey());
      setConfigured(hasApiKey());
      setWorkerUrlLocal(getWorkerUrl());
      setWorkerConfigured(hasWorkerUrl());
    }
  }, [open]);

  const handleSave = () => {
    setApiKey(key);
    setConfigured(hasApiKey());
    setWorkerUrl(workerUrl);
    setWorkerConfigured(hasWorkerUrl());
  };

  const handleClear = () => {
    setApiKey('');
    setKey('');
    setConfigured(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title="设置"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-element/30 bg-[#0a0710] text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-kai text-lg text-gold">设置</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            AI 解读需要 DeepSeek API Key；支付可选配置 Worker 实现微信支付验证。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* === DeepSeek API Key === */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground/80">AI 配置</span>
              {configured ? (
                <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                  已配置
                </span>
              ) : (
                <span className="rounded bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400">
                  未配置
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apikey" className="text-foreground/90">
                DeepSeek API Key
              </Label>
              <Input
                id="apikey"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="border-element/30 bg-[#0a0710]/60 text-foreground placeholder:text-muted-foreground/60 focus:border-element"
              />
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground/70">
              Key 仅保存在本机浏览器（localStorage），不会上传到任何服务器。也可在部署时通过
              <code className="mx-1 text-gold">VITE_DEEPSEEK_API_KEY</code>
              注入默认值。
            </p>
          </div>

          {/* === 支付配置 === */}
          <div className="border-t border-element/20 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground/80">支付配置（可选）</span>
              {workerConfigured ? (
                <span className="rounded bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                  已配置
                </span>
              ) : (
                <span className="rounded bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400">
                  离线模式
                </span>
              )}
            </div>

            <div className="mt-2 space-y-1.5">
              <Label htmlFor="workerUrl" className="text-foreground/90">
                支付 Worker 地址
              </Label>
              <Input
                id="workerUrl"
                type="url"
                autoComplete="off"
                placeholder="https://xuanjige-payment.xxxx.workers.dev"
                value={workerUrl}
                onChange={(e) => setWorkerUrlLocal(e.target.value)}
                className="border-element/30 bg-[#0a0710]/60 text-foreground placeholder:text-muted-foreground/60 focus:border-element"
              />
            </div>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
              配置后启用真实微信支付验证。未配置时使用离线降级模式（固定收款码 + 手动确认）。
              如何部署 Worker 请参考项目中的{' '}
              <code className="text-gold">workers/README.md</code>。
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-muted-foreground hover:text-element"
          >
            清除
          </Button>
          <Button
            onClick={handleSave}
            className="bg-element font-kai text-void hover:bg-element/80"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
