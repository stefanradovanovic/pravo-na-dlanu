"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import { BookOpen, FolderOpen, Scale, ArrowUpRight } from "lucide-react";
import type { RegistryRecord } from "@/lib/registry-types";
import { categoryLabel, lawPath } from "@/lib/registry-types";
import "@xyflow/react/dist/style.css";
type Data = {
  label: string;
  caption: string;
  kind: "root" | "category" | "law";
  target: string;
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
          "--node-color": data.kind === "root" ? "#963e35" : "#738363",
        } as React.CSSProperties
      }
    >
      <Handle type="target" position={Position.Left} />
      <span className="node-icon">
        <Icon size={20} />
      </span>
      <div>
        <small>{data.caption}</small>
        <strong>{data.label}</strong>
      </div>
      <ArrowUpRight size={13} />
      <Handle type="source" position={Position.Right} />
    </Button>
  );
}
const nodeTypes = { document: DocumentNode };
export function RegistryMap({
  categories,
  records,
  category,
  onCategory,
  total,
  page,
  onPage,
}: {
  categories: { name: string; count: number }[];
  records: RegistryRecord[];
  category: string;
  onCategory: (s: string) => void;
  total: number;
  page: number;
  onPage: (n: number) => void;
}) {
  const router = useRouter();
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
            if (data.kind === "law") router.push(lawPath(data.target));
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
        },
        395,
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
          },
          (i % 4) * 285,
          145 + Math.floor(i / 4) * 135,
        );
        edges.push({
          id: `e-${id}`,
          source: rootId,
          target: id,
          style: { stroke: "#c4c7b7" },
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
            target: r.id,
          },
          350 + (i % 2) * 310,
          Math.floor(i / 2) * 145,
        );
        edges.push({
          id: `e-${r.id}`,
          source: rootId,
          target: r.id,
          style: { stroke: "#c4c7b7" },
        });
      });
    }
    return { nodes, edges };
  }, [categories, category, records, total, onCategory, router]);
  return (
    <div className="map-shell">
      <div className="map-labels">
        <span>ИСТРАЖИТЕ ОБЛАСТ</span>
        <span>ЈЕДАН ЗАКОН · ЈЕДАН ДОКУМЕНТ</span>
        <span>ПОМЕРИТЕ И УВЕЋАЈТЕ</span>
      </div>
      <div className="map-canvas registry-canvas">
        <ReactFlow
          key={`${category}-${page}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="#dedfd4" gap={20} size={1} />
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
