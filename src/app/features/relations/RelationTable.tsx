import { ArrowRight, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import type {
  CharacterRelationRow,
  CharacterRow,
  SessionRunRow,
} from '../../lib/supabase/database.types';
import { RELATION_STYLES } from './relation-style';

interface Props {
  relations: CharacterRelationRow[];
  characters: CharacterRow[];
  sessions: SessionRunRow[];
  onEdit: (relationId: string) => void;
}

export function RelationTable({ relations, characters, sessions, onEdit }: Props) {
  const charById = new Map(characters.map((c) => [c.id, c]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  if (relations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">
        아직 등록된 관계가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[28%]">관계</TableHead>
            <TableHead className="w-[18%]">종류</TableHead>
            <TableHead className="w-[18%]">라벨</TableHead>
            <TableHead className="w-[20%]">시점</TableHead>
            <TableHead>메모</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {relations.map((r) => {
            const from = charById.get(r.from_character_id);
            const to = charById.get(r.to_character_id);
            const session = r.session_run_id ? sessionById.get(r.session_run_id) : null;
            const s = RELATION_STYLES[r.kind];

            return (
              <TableRow key={r.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span className="font-medium">{from?.name ?? '?'}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{to?.name ?? '?'}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="inline-block rounded-full border px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: s.bg,
                      borderColor: s.border,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{r.label}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {session ? session.title : '현재'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <span className="line-clamp-1">{r.note ?? '—'}</span>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(r.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
