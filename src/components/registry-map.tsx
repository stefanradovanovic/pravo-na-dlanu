"use client";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  BaseEdge,
  getViewportForBounds,
  useReactFlow,
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
  caption?: string;
  kind: "root" | "category" | "law";
  target: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  activate?: () => void;
  onHoverChange?: (id: string | null) => void;
  onFocusChange?: (id: string | null) => void;
};
type MapNode = Node<Data>;
type MapEdge = Edge<{ railX: number; firstRowY: number }>;
const nodeWidth = 260;
const columnStep = 320;
const rowStep = 168;
const compactRowGap = 16;
const compactRootGap = 32;
const compactGutter = 22;
const compactHorizontalPadding = 20;
const firstRowY = 180;
const minZoom = 0.05;
const maxZoom = 1.5;
const leftPadding = 48;
const rightPadding = 24;
const verticalPadding = 24;
const fitOptions = {
  padding: {
    left: `${leftPadding}px`,
    right: `${rightPadding}px`,
    y: `${verticalPadding}px`,
  },
} as const;
const compactFitOptions = {
  padding: {
    ...fitOptions.padding,
    left: `${compactHorizontalPadding}px`,
    right: `${compactHorizontalPadding}px`,
  },
} as const;
const coarsePointerQuery = "(pointer: coarse)";

function subscribeToPointer(onChange: () => void) {
  const media = window.matchMedia(coarsePointerQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function hasCoarsePointer() {
  return window.matchMedia(coarsePointerQuery).matches;
}

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

function DocumentNode({ id, data }: NodeProps<MapNode>) {
  const Icon =
    data.kind === "law" ? BookOpen : data.kind === "root" ? Scale : FolderOpen;
  return (
    <Button
      variant="ghost"
      className={`legal-node registry-node ${data.kind}`}
      title={data.label}
      onClick={data.activate}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") data.onHoverChange?.(id);
      }}
      onPointerLeave={() => data.onHoverChange?.(null)}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) {
          data.onFocusChange?.(id);
        }
      }}
      onBlur={() => data.onFocusChange?.(null)}
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
        {data.caption && <small>{data.caption}</small>}
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
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
}: EdgeProps<MapEdge>) {
  if (!data) return null;
  const busY = (sourceY + data.firstRowY) / 2;
  const path = `M ${sourceX} ${sourceY} V ${busY} H ${data.railX} V ${targetY} H ${targetX}`;
  return <BaseEdge id={id} path={path} interactionWidth={0} />;
}
const edgeTypes = { membership: MembershipEdge };
function FitCanvas({
  columns,
  fullscreen,
  graphHeight,
  minimumZoom,
  options,
}: {
  columns: number;
  fullscreen: boolean;
  graphHeight: number;
  minimumZoom: number;
  options: typeof fitOptions | typeof compactFitOptions;
}) {
  const { getNodes, getNodesBounds, setViewport } = useReactFlow();
  const ready = useStore(
    ({ nodeLookup, panZoom }) =>
      panZoom !== null &&
      nodeLookup.size > 0 &&
      Array.from(nodeLookup.values()).every(
        (node) => node.measured.height !== undefined,
      ),
  );
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  useEffect(() => {
    if (!ready || !width || !height) return;
    const frame = requestAnimationFrame(() => {
      const bounds = getNodesBounds(getNodes().map((node) => node.id));
      void setViewport(
        getViewportForBounds(
          bounds,
          width,
          height,
          minimumZoom,
          maxZoom,
          options.padding,
        ),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [
    columns,
    fullscreen,
    graphHeight,
    minimumZoom,
    width,
    height,
    options,
    ready,
    getNodes,
    getNodesBounds,
    setViewport,
  ]);
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
  const { getViewport, setViewport, zoomIn, zoomOut } = useReactFlow();
  const width = useStore((state) => state.width);
  const canZoomIn = useStore((state) => state.transform[2] < maxZoom);
  const canZoomOut = useStore((state) => state.transform[2] > state.minZoom);
  function zoom(increase: boolean) {
    if (fullscreen) {
      void (increase ? zoomIn() : zoomOut());
      return;
    }

    const { x, y, zoom: currentZoom } = getViewport();
    const nextZoom = increase
      ? Math.min(maxZoom, currentZoom * 1.2)
      : Math.max(minZoom, currentZoom / 1.2);
    const scale = nextZoom / currentZoom;
    // Keep the top of a tall inline map in view when zooming from its toolbar.
    void setViewport({
      x: width / 2 + (x - width / 2) * scale,
      y: verticalPadding + (y - verticalPadding) * scale,
      zoom: nextZoom,
    });
  }
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
        onClick={() => zoom(true)}
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
        onClick={() => zoom(false)}
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
  const toolbar = useRef<HTMLDivElement>(null);

  function selectCategory(value: string) {
    const element = toolbar.current;
    if (!fullscreen && element && element.getBoundingClientRect().top < 0) {
      element.scrollIntoView({ block: "start" });
    }
    props.onCategory(value);
  }

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
        onCategory={selectCategory}
        toolbar={toolbar}
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
  toolbar,
}: RegistryMapProps &
  MapControlsProps & { toolbar: React.Ref<HTMLDivElement> }) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const width = useStore((state) => state.width);
  const fullscreenHeight = useStore((state) => (fullscreen ? state.height : 0));
  const coarsePointer = useSyncExternalStore(
    subscribeToPointer,
    hasCoarsePointer,
    () => false,
  );
  const overview = category === "all";
  const children = useMemo<(Data & { id: string })[]>(
    () =>
      overview
        ? categories.map(({ name, count }, i) => ({
            id: `category-${i}`,
            label: categoryLabel(name),
            caption: formatDocumentCount(count),
            kind: "category",
            target: name,
          }))
        : records.map((record) => ({
            id: record.id,
            label: record.title,
            kind: "law",
            target: lawPath(record),
          })),
    [categories, overview, records],
  );
  const count = children.length;
  const availableWidth = Math.max(0, width - leftPadding - rightPadding);
  const inlineColumns = Math.max(
    1,
    1 + Math.floor((availableWidth - nodeWidth) / columnStep),
  );
  const maxColumns = overview ? Math.min(4, count) : count;
  const fittedColumns = Math.max(
    1,
    Math.min(
      maxColumns,
      fullscreen && fullscreenHeight > 0
        ? fitColumns(
            count,
            availableWidth /
              Math.max(1, fullscreenHeight - 2 * verticalPadding),
          )
        : inlineColumns,
    ),
  );
  const useFiveColumns =
    !overview && count > 50 && (fullscreen || inlineColumns >= 3);
  const compactLayout = count > 1 && width > 0 && inlineColumns === 1;
  const columns = compactLayout ? 2 : useFiveColumns ? 5 : fittedColumns;
  const fitWidth = compactLayout
    ? width - 2 * compactHorizontalPadding
    : availableWidth;
  const childWidth = compactLayout
    ? Math.max(1, (fitWidth - compactGutter) / columns)
    : nodeWidth;
  const xStep = compactLayout ? childWidth + compactGutter : columnStep;
  const gutterCenterOffset = (xStep - childWidth) / 2;
  const graphWidth = childWidth + (columns - 1) * xStep;
  const rootWidth = Math.min(nodeWidth, graphWidth);
  const options = compactLayout ? compactFitOptions : fitOptions;
  const inlineZoom = Math.min(maxZoom, fitWidth / graphWidth);
  const nodeSizes = useStore(
    ({ nodeLookup }) => [
      nodeLookup.get("root")?.measured,
      ...children.map(({ id }) => nodeLookup.get(id)?.measured),
    ],
    (a, b) =>
      a.length === b.length &&
      a.every(
        (size, i) =>
          size?.width === b[i]?.width && size?.height === b[i]?.height,
      ),
  );
  const startY = compactLayout
    ? (nodeSizes[0]?.height ?? 100) + compactRootGap
    : firstRowY;
  const compactRowOffsets = useMemo(() => {
    if (!compactLayout) return null;
    const offsets = [startY];
    let y = startY;
    for (let i = 0; i < count; i += columns) {
      const left = nodeSizes[i + 1]?.height;
      const right = nodeSizes[i + 2]?.height;
      y +=
        Math.max(left ?? rowStep - compactRowGap, right ?? 0) + compactRowGap;
      offsets.push(y);
    }
    return offsets;
  }, [columns, compactLayout, count, nodeSizes, startY]);
  const graphHeight =
    compactRowOffsets?.at(-1) ??
    firstRowY + Math.ceil(count / columns) * rowStep;
  const minimumZoom =
    compactLayout && fullscreenHeight > 2 * verticalPadding
      ? Math.min(
          minZoom,
          (fullscreenHeight - 2 * verticalPadding) / graphHeight,
        )
      : minZoom;
  const inlineHeight =
    Math.ceil(graphHeight * inlineZoom) + 2 * verticalPadding;
  const { nodes, edges } = useMemo(() => {
    const nodes: MapNode[] = [];
    const edges: MapEdge[] = [];
    const rootId = "root";
    const add = (
      id: string,
      data: Data,
      x: number,
      y: number,
      width: number,
      measured: MapNode["measured"],
    ) =>
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
        width,
        measured,
        ariaLabel: data.label,
        focusable: false,
      });
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
      (graphWidth - rootWidth) / 2,
      0,
      rootWidth,
      nodeSizes[0],
    );
    children.forEach(({ id, ...data }, i) => {
      const x = (i % columns) * xStep;
      const row = Math.floor(i / columns);
      const connectsOnRight = compactLayout && i % columns === 1;
      add(
        id,
        {
          ...data,
          targetPosition: connectsOnRight ? Position.Right : Position.Left,
          onHoverChange: setHoveredNodeId,
          onFocusChange: setFocusedNodeId,
        },
        x,
        compactRowOffsets?.[row] ?? startY + row * rowStep,
        childWidth,
        nodeSizes[i + 1],
      );
      edges.push({
        id: `e-${id}`,
        source: rootId,
        target: id,
        type: "membership",
        data: {
          railX: connectsOnRight
            ? x + childWidth + gutterCenterOffset
            : x - gutterCenterOffset,
          firstRowY: startY,
        },
      });
    });
    return { nodes, edges };
  }, [
    category,
    children,
    childWidth,
    columns,
    compactLayout,
    compactRowOffsets,
    graphWidth,
    gutterCenterOffset,
    overview,
    nodeSizes,
    records.length,
    onCategory,
    returnTo,
    rootWidth,
    startY,
    xStep,
  ]);
  const highlightedNodeId = hoveredNodeId ?? focusedNodeId;
  const displayEdges = useMemo(
    () =>
      highlightedNodeId === null
        ? edges
        : edges.map((edge) =>
            edge.target === highlightedNodeId
              ? { ...edge, className: "is-highlighted", zIndex: 1 }
              : edge,
          ),
    [edges, highlightedNodeId],
  );
  return (
    <div className={`map-shell${fullscreen ? " is-fullscreen" : ""}`}>
      <div ref={toolbar} className="map-labels">
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
      <div
        className="map-canvas registry-canvas"
        data-compact-layout={compactLayout || undefined}
        style={
          {
            "--registry-fit-height": `${inlineHeight}px`,
          } as React.CSSProperties
        }
      >
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={options}
          minZoom={minimumZoom}
          maxZoom={maxZoom}
          zoomOnScroll={false}
          preventScrolling={false}
          panOnDrag={fullscreen || !coarsePointer}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <FitCanvas
            columns={columns}
            fullscreen={fullscreen}
            graphHeight={graphHeight}
            minimumZoom={minimumZoom}
            options={options}
          />
          <Background color="var(--border)" gap={20} size={1} />
        </ReactFlow>
      </div>
      <div className="map-footer">
        <span>
          <i />{" "}
          {category === "all" ? "Изаберите област." : "Изаберите документ."}
        </span>
        <div className="map-footer-meta">
          {overview && <span>{categories.length} области</span>}
          <Link href="/o-projektu" className="text-link">
            Извор
          </Link>
        </div>
      </div>
    </div>
  );
}
