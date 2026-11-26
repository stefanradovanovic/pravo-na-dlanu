"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
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
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RegistryRecord } from "@/lib/registry-types";
import {
  categoryLabel,
  formatDocumentCount,
  lawPath,
} from "@/lib/registry-types";
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
const columnStep = 320;
const rowStep = 168;
const firstRowY = 180;

function fitColumns(count: number, aspectRatio: number) {
  let columns = 1;
  let bestScale = 0;
  for (let candidate = 1; candidate <= count; candidate++) {
    const width = candidate * columnStep;
    const height = firstRowY + Math.ceil(count / candidate) * rowStep;
    const scale = Math.min(aspectRatio / width, 1 / height);
    if (scale > bestScale) {
      columns = candidate;
      bestScale = scale;
    }
  }
  return columns;
}

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
        <strong>{data.label}</strong>
        <small>{data.caption}</small>
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
  style,
}: EdgeProps) {
  const railX = targetX - 28;
  const busY = (sourceY + firstRowY) / 2;
  const path = `M ${sourceX} ${sourceY} V ${busY} H ${railX} V ${targetY} H ${targetX}`;
  return <BaseEdge id={id} path={path} style={style} interactionWidth={0} />;
}
const edgeTypes = { membership: MembershipEdge };
function FitCanvas({ columns }: { columns: number }) {
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
  }, [columns, width, height, ready, fitView]);
  return null;
}

type MapControlsProps = {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  fullscreenButton: React.Ref<HTMLButtonElement>;
};

function MapControls({
  fullscreen,
  onToggleFullscreen,
  fullscreenButton,
}: MapControlsProps) {
  const { zoomIn, zoomOut } = useReactFlow();
  const canZoomIn = useStore((state) => state.transform[2] < state.maxZoom);
  const canZoomOut = useStore((state) => state.transform[2] > state.minZoom);
  return (
    <div
      role="group"
      aria-label="Контроле мапе"
      className="map-controls flex items-center gap-1"
    >
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Увећај мапу"
        title="Увећај мапу"
        disabled={!canZoomIn}
        focusableWhenDisabled
        onClick={() => {
          void zoomIn();
        }}
      >
        <Plus aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Умањи мапу"
        title="Умањи мапу"
        disabled={!canZoomOut}
        focusableWhenDisabled
        onClick={() => {
          void zoomOut();
        }}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Button
        ref={fullscreenButton}
        variant="outline"
        size="sm"
        onClick={onToggleFullscreen}
        aria-pressed={fullscreen}
      >
        {fullscreen ? (
          <Minimize aria-hidden="true" />
        ) : (
          <Maximize aria-hidden="true" />
        )}
        Цео екран
      </Button>
    </div>
  );
}

type RegistryMapProps = {
  categories: { name: string; count: number }[];
  records: RegistryRecord[];
  category: string;
  onCategory: (s: string) => void;
  returnTo: string;
};

export function RegistryMap(props: RegistryMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false);
        fullscreenButton.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);
  return (
    <ReactFlowProvider key={props.category}>
      <RegistryMapContent
        {...props}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
        fullscreenButton={fullscreenButton}
      />
    </ReactFlowProvider>
  );
}

function RegistryMapContent({
  categories,
  records,
  category,
  onCategory,
  returnTo,
  fullscreen,
  onToggleFullscreen,
  fullscreenButton,
}: RegistryMapProps & MapControlsProps) {
  const aspectRatio = useStore((state) =>
    state.width > 0 && state.height > 0 ? state.width / state.height : 2,
  );
  const columns =
    category === "all" ? 4 : fitColumns(records.length, aspectRatio);
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
    const overview = category === "all";
    add(
      rootId,
      {
        label: overview ? "Правне области" : categoryLabel(category),
        caption: overview
          ? "КАТЕГОРИЈЕ ЗВАНИЧНОГ РЕГИСТРА"
          : formatDocumentCount(records.length),
        kind: overview ? "root" : "category",
        target: "all",
        sourcePosition: Position.Bottom,
      },
      ((columns - 1) * columnStep) / 2,
      0,
    );
    const children: (Data & { id: string })[] = overview
      ? categories.map(({ name, count }, i) => ({
          id: `category-${i}`,
          label: categoryLabel(name),
          caption: formatDocumentCount(count),
          kind: "category",
          target: name,
        }))
      : records.map((r) => ({
          id: r.id,
          label: r.title,
          caption: `${r.documentType.toUpperCase()} · ${r.citation.slice(r.title.length).match(/\d+\/\d{4}/)?.[0] ?? "ПИС"}`,
          kind: "law",
          target: lawPath(r),
        }));
    children.forEach(({ id, ...data }, i) => {
      add(
        id,
        { ...data, targetPosition: Position.Left },
        (i % columns) * columnStep,
        firstRowY + Math.floor(i / columns) * rowStep,
      );
      edges.push({
        id: `e-${id}`,
        source: rootId,
        target: id,
        type: "membership",
        style: { stroke: "var(--editorial-border)" },
      });
    });
    return { nodes, edges };
  }, [categories, category, columns, records, onCategory, returnTo]);
  return (
    <div className={`map-shell${fullscreen ? " is-fullscreen" : ""}`}>
      <div className="map-labels">
        {category !== "all" && (
          <Button variant="outline" size="sm" onClick={() => onCategory("all")}>
            <ArrowLeft aria-hidden="true" /> Назад на области
          </Button>
        )}
        <MapControls
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
          fullscreenButton={fullscreenButton}
        />
      </div>
      <div className="map-canvas registry-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.05}
          maxZoom={1.5}
          zoomOnScroll={false}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <FitCanvas columns={columns} />
          <Background color="var(--border)" gap={20} size={1} />
        </ReactFlow>
      </div>
      <div className="map-footer">
        <span>
          <i />{" "}
          {category === "all" ? "Изаберите област." : "Изаберите документ."}
        </span>
        {category === "all" && <span>{categories.length} области</span>}
      </div>
    </div>
  );
}
