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

/**
 * 设置面板：配置 DeepSeek API Key。
 * Key 仅保存在浏览器 localStorage（优先级高于构建期注入的 VITE_DEEPSEEK_API_KEY），
 * 未配置时 AI 解读自动降级为规则式，不影响排盘/起卦核心功能。
 */
export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getApiKey());
      setConfigured(hasApiKey());
    }
  }, [open]);

  const handleSave = () => {
    setApiKey(key);
    setConfigured(hasApiKey());
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
          className="text-gray-300 hover:text-white"
          title="设置"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-red-900/30 bg-[#0d0505] text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-lg text-red-400">设置</DialogTitle>
          <DialogDescription className="text-gray-500">
            AI 解读需要 DeepSeek API Key；未配置时自动使用规则式降级解读。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">当前状态</span>
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
            <Label htmlFor="apikey" className="text-gray-300">
              DeepSeek API Key
            </Label>
            <Input
              id="apikey"
              type="password"
              autoComplete="off"
              placeholder="sk-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="border-red-900/40 bg-black/60 text-gray-200 placeholder:text-gray-600 focus:border-red-500"
            />
          </div>

          <p className="text-xs leading-relaxed text-gray-600">
            Key 仅保存在本机浏览器（localStorage），不会上传到任何服务器。也可在部署时通过
            <code className="mx-1 text-gray-400">VITE_DEEPSEEK_API_KEY</code>
            注入默认值。
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-gray-400 hover:text-red-300"
          >
            清除
          </Button>
          <Button
            onClick={handleSave}
            className="bg-red-700 text-white hover:bg-red-600"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
