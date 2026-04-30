import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import type { CoCData } from '../../lib/coc/types';
import { generateKokoroforiaPalette } from '../../lib/kokoroforia/palette';

interface Props {
  characterName: string;
  data: CoCData;
  trigger: React.ReactNode;
}

/**
 * 코코포리아 채팅팔레트 export 다이얼로그.
 * 트리거 클릭 → 다이얼로그 열림 → 생성된 텍스트 표시 → 복사 / 다운로드.
 */
export function KokoroforiaExportDialog({ characterName, data, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const palette = useMemo(
    () => generateKokoroforiaPalette({ characterName, data }),
    [characterName, data],
  );

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const lineCount = palette.split('\n').length;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(palette);
      setCopied(true);
      toast.success('팔레트가 클립보드에 복사되었어요');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 일부 브라우저는 secure context 외부에서 clipboard 거절. fallback: textarea select.
      taRef.current?.select();
      try {
        document.execCommand('copy');
        toast.success('복사됨 (fallback)');
      } catch {
        toast.error('복사 실패 — textarea 를 직접 선택해 복사해 주세요');
      }
    }
  };

  const onDownload = () => {
    const blob = new Blob([palette], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterName} 채팅팔레트.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>코코포리아 채팅팔레트</DialogTitle>
          <DialogDescription>
            {lineCount}줄 — 코코포리아 캐릭터 시트 → 채팅팔레트 칸에 통째로 붙여넣으세요.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          ref={taRef}
          readOnly
          value={palette}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          className="min-h-0 flex-1 resize-none font-mono text-xs"
        />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDownload}>
            <Download className="mr-1 h-4 w-4" />
            .txt
          </Button>
          <Button type="button" onClick={onCopy}>
            {copied ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="mr-1 h-4 w-4" />
                클립보드 복사
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
