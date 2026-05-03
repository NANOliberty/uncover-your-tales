import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {
  CharacterRelationRow,
  CharacterRow,
} from '../../lib/supabase/database.types';
import { CharacterNode, type CharacterNodeData } from './CharacterNode';
import type { AutoLink } from './api';
import { RELATION_STYLES } from './relation-style';

const nodeTypes = { character: CharacterNode };

/** 캐릭터 N명을 큰 원 위에 균등 배치. 중심 = (0, 0). */
function circleLayout(count: number, radius: number) {
  if (count <= 1) return [{ x: 0, y: 0 }];
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2; // 12시 방향부터 시계방향
    return {
      x: Math.cos(a) * radius,
      y: Math.sin(a) * radius,
    };
  });
}

interface Props {
  characters: CharacterRow[];
  manualRelations: CharacterRelationRow[];
  autoLinks: AutoLink[];
  groupSlug: string;
  onCharacterClick?: (characterId: string) => void;
  onRelationClick?: (relationId: string) => void;
  /** 자동 약한 연결 표시 여부 */
  showAuto: boolean;
}

export function RelationGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <RelationGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function RelationGraphInner({
  characters,
  manualRelations,
  autoLinks,
  groupSlug,
  onCharacterClick,
  onRelationClick,
  showAuto,
}: Props) {
  const initialNodes = useMemo<Node<CharacterNodeData>[]>(() => {
    const radius = Math.max(220, characters.length * 38);
    const positions = circleLayout(characters.length, radius);
    return characters.map((c, i) => ({
      id: c.id,
      type: 'character',
      position: positions[i],
      data: {
        name: c.name,
        portraitUrl: c.portrait_url,
        occupation: c.occupation,
        system: c.system,
        status: c.status,
        groupSlug,
        characterId: c.id,
      },
    }));
  }, [characters, groupSlug]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CharacterNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 캐릭터 목록이 바뀌면 노드 갱신 (위치는 보존하기 어려우므로 일단 reset)
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // 엣지 — 자동 약한 연결 + 수동 관계
  const computedEdges = useMemo<Edge[]>(() => {
    const out: Edge[] = [];

    if (showAuto) {
      for (const link of autoLinks) {
        out.push({
          id: `auto::${link.fromCharacterId}::${link.toCharacterId}`,
          source: link.fromCharacterId,
          target: link.toCharacterId,
          type: 'default',
          animated: false,
          style: {
            stroke: '#cbd5e1', // slate-300
            strokeWidth: 1.2,
            strokeDasharray: '4 4',
          },
          label:
            link.sessionRunIds.length > 1
              ? `세션 ${link.sessionRunIds.length}회`
              : undefined,
          labelStyle: { fontSize: 10, fill: '#64748b' },
          labelBgStyle: { fill: '#fff' },
          labelBgPadding: [3, 2],
          labelBgBorderRadius: 4,
          data: { kind: 'auto' },
        });
      }
    }

    for (const r of manualRelations) {
      const s = RELATION_STYLES[r.kind];
      out.push({
        id: r.id,
        source: r.from_character_id,
        target: r.to_character_id,
        type: 'default',
        style: {
          stroke: s.color,
          strokeWidth: r.kind === 'bond' ? 2.5 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: s.color,
          width: 18,
          height: 18,
        },
        label: r.label,
        labelStyle: {
          fontSize: 11,
          fill: s.color,
          fontWeight: 600,
        },
        labelBgStyle: { fill: s.bg, stroke: s.border },
        labelBgPadding: [4, 4],
        labelBgBorderRadius: 6,
        data: { kind: 'manual', relation: r },
      });
    }

    return out;
  }, [autoLinks, manualRelations, showAuto]);

  useEffect(() => {
    setEdges(computedEdges);
  }, [computedEdges, setEdges]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      onCharacterClick?.(node.id);
    },
    [onCharacterClick],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_e, edge) => {
      const data = edge.data as { kind?: string } | undefined;
      if (data?.kind === 'manual') {
        onRelationClick?.(edge.id);
      }
    },
    [onRelationClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onEdgeClick={handleEdgeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
      <Controls position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
}
