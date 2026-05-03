import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { CharacterStatus, TrpgSystem } from '../../lib/supabase/database.types';

export interface CharacterNodeData {
  name: string;
  portraitUrl: string | null;
  occupation: string | null;
  system: TrpgSystem;
  status: CharacterStatus;
  /** 그룹 slug — 클릭 시 캐릭터 디테일 라우팅용 */
  groupSlug: string;
  characterId: string;
  /** 외부에서 클릭 핸들러 주입 — 셀렉션 패널 띄우기 등 */
  onSelect?: (characterId: string) => void;
}

const STATUS_RING: Record<CharacterStatus, string> = {
  active: 'ring-2 ring-emerald-400/60',
  retired: 'ring-2 ring-amber-300/60 saturate-50',
  dead: 'ring-2 ring-zinc-400/60 grayscale',
};

const STATUS_LABEL: Record<CharacterStatus, string> = {
  active: '',
  retired: '은퇴',
  dead: '사망',
};

/**
 * React Flow 커스텀 노드.
 * 인물 일러스트가 메인, 이름/직업/상태가 따라붙음.
 */
export function CharacterNode({ data, selected }: NodeProps & { data: CharacterNodeData }) {
  return (
    <div
      className={`group flex w-44 flex-col items-center gap-2 rounded-2xl border bg-card px-3 py-3 shadow-sm transition ${
        selected ? 'border-primary shadow-md' : 'border-border hover:shadow-md'
      }`}
    >
      {/* 양방향 엣지 모두 받기 위해 4방향 핸들 */}
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-transparent" />

      <div className={`relative h-20 w-20 overflow-hidden rounded-full bg-muted ${STATUS_RING[data.status]}`}>
        {data.portraitUrl ? (
          <img
            src={data.portraitUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <User className="h-7 w-7" />
          </div>
        )}
        {STATUS_LABEL[data.status] && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/80 px-1.5 py-0.5 text-[10px] leading-none text-white">
            {STATUS_LABEL[data.status]}
          </span>
        )}
      </div>

      <div className="w-full text-center">
        <p className="truncate text-sm font-medium">{data.name}</p>
        {data.occupation && (
          <p className="truncate text-[11px] text-muted-foreground">{data.occupation}</p>
        )}
      </div>
    </div>
  );
}
