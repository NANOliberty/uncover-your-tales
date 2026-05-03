import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { Network, Plus, Table2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../components/ui/toggle-group';
import type {
  CharacterRelationRow,
  GroupRow,
} from '../lib/supabase/database.types';
import { useGroupCharacters } from '../features/characters/api';
import { useGroupSessions } from '../features/sessions/api';
import { useAutoLinks, useGroupRelations } from '../features/relations/api';
import { RelationGraph } from '../features/relations/RelationGraph';
import { RelationTable } from '../features/relations/RelationTable';
import { RelationFormDialog } from '../features/relations/RelationFormDialog';
import { RELATION_STYLES } from '../features/relations/relation-style';

interface GroupOutletContext {
  group: GroupRow;
}

type ViewMode = 'graph' | 'table';

/**
 * 관계 맵 — 그룹 내 캐릭터 관계 시각화 (M6, 핵심 가치 #4).
 *
 * - 자동 약한 연결: 같은 SessionRun 참여한 캐릭터 쌍 (회색 dashed)
 * - 수동 관계: kind 별 색·라벨, directed 화살표
 * - 시점 selector: "현재" / 각 SessionRun
 * - 뷰 토글: 그래프 / 표
 */
export function RelationsPage() {
  const { group } = useOutletContext<GroupOutletContext>();
  const navigate = useNavigate();

  const { data: characters = [], isLoading: charsLoading } = useGroupCharacters(group.id);
  const { data: sessions = [] } = useGroupSessions(group.id);
  const { data: relations = [], isLoading: relsLoading } = useGroupRelations(group.id);
  const { data: autoLinks = [] } = useAutoLinks(group.id);

  const [view, setView] = useState<ViewMode>('graph');
  const [viewpoint, setViewpoint] = useState<string>('current'); // 'current' | sessionId
  const [showAuto, setShowAuto] = useState(true);

  // 다이얼로그
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // 시점에 맞춰 보이는 관계 필터
  const visibleRelations = useMemo<CharacterRelationRow[]>(() => {
    if (viewpoint === 'current') {
      // "현재" = session_run_id null 인 것만
      return relations.filter((r) => r.session_run_id === null);
    }
    return relations.filter((r) => r.session_run_id === viewpoint);
  }, [relations, viewpoint]);

  // 시점에 맞춰 보이는 자동 연결
  const visibleAutoLinks = useMemo(() => {
    if (viewpoint === 'current') return autoLinks; // 누적
    return autoLinks.filter((l) => l.sessionRunIds.includes(viewpoint));
  }, [autoLinks, viewpoint]);

  const editingRelation = editingId
    ? relations.find((r) => r.id === editingId) ?? null
    : null;

  const handleCharacterClick = (characterId: string) => {
    navigate(`/g/${group.slug}/characters/${characterId}`);
  };

  const isLoading = charsLoading || relsLoading;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 px-6 py-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">관계 맵</h1>
          <p className="text-sm text-muted-foreground">
            캐릭터 간 관계를 한눈에. 같은 세션에 참여한 캐릭터들은 자동으로 약한 선이 그어집니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 시점 selector */}
          <Select value={viewpoint} onValueChange={setViewpoint}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">현재 시점</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 뷰 토글 */}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as ViewMode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="graph" aria-label="그래프">
              <Network className="mr-1 h-4 w-4" />
              그래프
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="표">
              <Table2 className="mr-1 h-4 w-4" />
              표
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            type="button"
            size="sm"
            onClick={() => setCreating(true)}
            disabled={characters.length < 2}
          >
            <Plus className="mr-1 h-4 w-4" />
            관계 추가
          </Button>
        </div>
      </div>

      {/* 범례 */}
      {view === 'graph' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-xs">
          <span className="text-muted-foreground">범례 ·</span>
          {Object.entries(RELATION_STYLES).map(([k, s]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-5"
                style={{ backgroundColor: s.color }}
              />
              <span style={{ color: s.color }}>{s.label}</span>
            </span>
          ))}
          <span className="ml-2 inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5 border-t border-dashed"
              style={{ borderColor: '#94a3b8' }}
            />
            <span className="text-muted-foreground">같은 세션 참여</span>
          </span>
          <label className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
            <input
              type="checkbox"
              checked={showAuto}
              onChange={(e) => setShowAuto(e.target.checked)}
              className="h-3.5 w-3.5 accent-foreground"
            />
            자동 연결 표시
          </label>
        </div>
      )}

      {/* 본문 */}
      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            불러오는 중…
          </div>
        ) : characters.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card text-center">
            <p className="font-medium">캐릭터가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              먼저 캐릭터를 만들면 관계 맵이 의미가 생겨요.
            </p>
          </div>
        ) : view === 'graph' ? (
          <div className="h-full overflow-hidden rounded-xl border bg-card">
            <RelationGraph
              characters={characters}
              manualRelations={visibleRelations}
              autoLinks={visibleAutoLinks}
              groupSlug={group.slug}
              showAuto={showAuto}
              onCharacterClick={handleCharacterClick}
              onRelationClick={(id) => setEditingId(id)}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <RelationTable
              relations={visibleRelations}
              characters={characters}
              sessions={sessions}
              onEdit={(id) => setEditingId(id)}
            />
          </div>
        )}
      </div>

      {/* 생성 다이얼로그 */}
      <RelationFormDialog
        open={creating}
        onOpenChange={setCreating}
        groupId={group.id}
        characters={characters}
        sessions={sessions}
        existing={null}
        defaultSessionId={viewpoint === 'current' ? null : viewpoint}
      />

      {/* 편집 다이얼로그 */}
      <RelationFormDialog
        open={!!editingRelation}
        onOpenChange={(v) => !v && setEditingId(null)}
        groupId={group.id}
        characters={characters}
        sessions={sessions}
        existing={editingRelation}
      />
    </div>
  );
}
