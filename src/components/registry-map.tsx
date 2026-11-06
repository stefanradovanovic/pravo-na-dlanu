"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  Handle,
  Position,
  BaseEdge,
  useReactFlow,
  useNodesInitialized,
  useStore,
  type EdgeProps,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import {
  BookOpen,
  FolderOpen,
  Scale,
  ArrowUpRight,
  ArrowLeft,
  Maximize,
  Minimize,
} from "lucide-react";
import type { RegistryRecord } from "@/lib/registry-types";
import { categoryLabel, lawPath } from "@/lib/registry-types";
import { documentUrl } from "@/lib/explorer-url";
import "@xyflow/react/dist/style.css";
type Data = {
  label: string;
  caption: string;
  kind: "root" | "category" | "law";
  target: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  activate?: () => void;
};
type MapNode = Node<Data>;
function DocumentNode({ data }: NodeProps<MapNode>) {
  const Icon =
    data.kind === "law" ? BookOpen : data.kind === "root" ? Scale : FolderOpen;
  return (
    <Button
      variant="ghost"
      className={`legal-node registry-node ${data.kind}`}
      title={data.label}
      onClick={data.activate}
      style={
        {
          "--node-color":
            data.kind === "root"
              ? "var(--brand)"
              : "var(--editorial-foreground)",
        } as React.CSSProperties
      }
    >
      {data.targetPosition && (
        <Handle type="target" position={data.targetPosition} />
      )}
      <span className="node-icon">
        <Icon size={20} />
      </span>
      <div>
        <small>{data.caption}</small>
        <strong>{data.label}</strong>
      </div>
      <ArrowUpRight size={13} />
      {data.sourcePosition && (
        <Handle type="source" position={data.sourcePosition} />
      )}
    </Button>
  );
}
const nodeTypes = { document: DocumentNode };
// Route category membership through the gutters, never behind another card.
function MembershipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps) {
  const overview = data?.overview === true;
  const railX = targetX - 28;
  const busY = overview ? 140 : -35;
  const path = overview
    ? `M ${sourceX} ${sourceY} V ${busY} H ${railX} V ${targetY} H ${targetX}`
    : `M ${sourceX} ${sourceY} H 290 V ${busY} H ${railX} V ${targetY} H ${targetX}`;
  return <BaseEdge id={id} path={path} style={style} interactionWidth={0} />;
}
const edgeTypes = { membership: MembershipEdge };
function FitCanvas() {
  const { fitView } = useReactFlow();
  const ready = useNodesInitialized();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  useEffect(() => {
    if (!ready) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        void fitView({ padding: 0.12 });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [width, height, ready, fitView]);
  return null;
}
export function RegistryMap({
  categories,
  records,
  category,
  onCategory,
  total,
  page,
  onPage,
  returnTo,
}: {
  categories: { name: string; count: number }[];
  records: RegistryRecord[];
  category: string;
  onCategory: (s: string) => void;
  total: number;
  page: number;
  onPage: (n: number) => void;
  returnTo: string;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);
  const { nodes, edges } = useMemo(() => {
    const nodes: MapNode[] = [];
    const edges: Edge[] = [];
    const rootId = "root";
    const add = (id: string, data: Data, x: number, y: number) =>
      nodes.push({
        id,
        type: "document",
        data: {
          ...data,
          activate: () => {
            if (data.kind === "law")
              window.location.assign(documentUrl(data.target, returnTo));
            else onCategory(data.target);
          },
        },
        position: { x, y },
        ariaLabel: data.label,
        focusable: false,
      });
    if (category === "all") {
      add(
        rootId,
        {
          label: "Правне области",
          caption: "КАТЕГОРИЈЕ ЗВАНИЧНОГ РЕГИСТРА",
          kind: "root",
          target: "all",
          sourcePosition: Position.Bottom,
        },
        480,
        0,
      );
      categories.forEach((c, i) => {
        const id = `category-${i}`;
        add(
          id,
          {
            label: categoryLabel(c.name),
            caption: `${c.count} ДОКУМЕНАТА`,
            kind: "category",
            target: c.name,
            targetPosition: Position.Left,
          },
          (i % 4) * 320,
          180 + Math.floor(i / 4) * 168,
        );
        edges.push({
          id: `e-${id}`,
          source: rootId,
          target: id,
          type: "membership",
          data: { overview: true },
          style: { stroke: "var(--editorial-border)" },
        });
      });
    } else {
      add(
        rootId,
        {
          label: categoryLabel(category),
          caption: `ОБЛАСТ · ${total} ДОКУМЕНАТА`,
          kind: "category",
          target: "all",
          sourcePosition: Position.Right,
        },
        0,
        200,
      );
      records.forEach((r, i) => {
        add(
          r.id,
          {
            label: r.title,
            caption: `${r.documentType.toUpperCase()} · ${r.citation.slice(r.title.length).match(/\d+\/\d{4}/)?.[0] ?? "ПИС"}`,
            kind: "law",
            target: lawPath(r),
            targetPosition: Position.Left,
          },
          350 + (i % 2) * 310,
          Math.floor(i / 2) * 168,
        );
        edges.push({
          id: `e-${r.id}`,
          source: rootId,
          target: r.id,
          type: "membership",
          style: { stroke: "var(--editorial-border)" },
        });
      });
    }
    return { nodes, edges };
  }, [categories, category, records, total, onCategory, returnTo]);
  return (
    <div className={`map-shell${fullscreen ? " is-fullscreen" : ""}`}>
      <div className="map-labels">
        <span>ИСТРАЖИТЕ ОБЛАСТ</span>
        <span>ЈЕДАН ЗАКОН · ЈЕДАН ДОКУМЕНТ</span>
        <span>ПОМЕРИТЕ И УВЕЋАЈТЕ</span>
      </div>
      <div className="map-canvas registry-canvas">
        <ReactFlow
          key={`${category}-${page}-${fullscreen}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          ariaLabelConfig={{
            "controls.fitView.ariaLabel": "Прикажи целу мапу",
            "controls.zoomIn.ariaLabel": "Увећај мапу",
            "controls.zoomOut.ariaLabel": "Умањи мапу",
          }}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <FitCanvas />
          <Background color="var(--border)" gap={20} size={1} />
          <Panel position="top-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreen((value) => !value)}
              aria-pressed={fullscreen}
            >
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              {fullscreen ? "Смањи приказ" : "Цео екран"}
            </Button>
          </Panel>
          {category !== "all" && (
            <Panel position="top-left">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCategory("all")}
              >
                <ArrowLeft size={16} /> Назад на области
              </Button>
            </Panel>
          )}
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="map-footer">
        <span>
          <i /> Изаберите област, затим закон. Везе означавају припадност
          категорији.
        </span>
        <span>
          {category === "all"
            ? `${categories.length} области`
            : `${page * 8 + 1}–${Math.min((page + 1) * 8, total)} од ${total}`}
        </span>
      </div>
      {category !== "all" && total > 8 && (
        <MapPager page={page} total={total} onPage={onPage} />
      )}
    </div>
  );
}
import { Button } from "@/components/ui/button";
function MapPager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (n: number) => void;
}) {
  return (
    <div className="catalog-pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={!page}
        onClick={() => onPage(page - 1)}
      >
        Претходни закони
      </Button>
      <span>
        {page + 1} / {Math.ceil(total / 8)}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={(page + 1) * 8 >= total}
        onClick={() => onPage(page + 1)}
      >
        Следећи закони
      </Button>
    </div>
  );
}
