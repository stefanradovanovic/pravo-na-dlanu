"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, ArrowRight, Network } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  InstitutionEdge,
  InstitutionMap,
  InstitutionNode,
  InstitutionProcedure,
} from "@/lib/institution-map";
import { InstitutionSources } from "./institution-sources";
import { useInstitutionFragment } from "./use-institution-fragment";
import "./institution-procedure.css";

function Procedure({
  id,
  procedure,
}: {
  id: string;
  procedure: InstitutionProcedure;
}) {
  return (
    <section className="institution-procedure" aria-labelledby={id}>
      <h2 id={id}>{procedure.title}</h2>
      {procedure.intro && <p>{procedure.intro}</p>}
      <ol>
        {procedure.steps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <InstitutionSources sources={step.sources} />
          </li>
        ))}
      </ol>
      {procedure.note && (
        <>
          <h3>{procedure.note.title}</h3>
          <p>{procedure.note.text}</p>
          <InstitutionSources sources={procedure.note.sources} />
        </>
      )}
    </section>
  );
}

function Relationship({
  edge,
  from,
  to,
  outgoing,
  onExplore,
}: {
  edge: InstitutionEdge;
  from: InstitutionNode;
  to: InstitutionNode;
  outgoing: boolean;
  onExplore: (id: string) => void;
}) {
  const neighbour = outgoing ? to : from;
  const description = `${from.name} → ${to.name}`;
  return (
    <li className="institution-branch">
      <div className="institution-connector">
        <Dialog>
          <DialogTrigger
            className={buttonVariants({ variant: "secondary", size: "sm" })}
            aria-label={`${edge.label} (${description})`}
          >
            {!outgoing && <ArrowLeft aria-hidden="true" />}
            <span>{edge.label}</span>
            {outgoing && <ArrowRight aria-hidden="true" />}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{edge.label}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <p className="institution-edge-detail">{edge.detail}</p>
            <InstitutionSources sources={edge.sources} />
          </DialogContent>
        </Dialog>
      </div>
      <Button variant="outline" onClick={() => onExplore(neighbour.id)}>
        <span>{neighbour.name}</span>
      </Button>
    </li>
  );
}

function TopicMap({ map }: { map: InstitutionMap }) {
  const [selected, setSelected] = useState(map.nodes[0].id);
  const heading = useRef<HTMLHeadingElement>(null);
  const nodes = new Map(map.nodes.map((node) => [node.id, node]));
  const focus = nodes.get(selected)!;
  const edges = map.edges.filter(
    (edge) => edge.from === selected || edge.to === selected,
  );

  function explore(id: string) {
    flushSync(() => setSelected(id));
    heading.current?.focus();
  }

  return (
    <>
      <div className="institution-toolbar">
        <h2>{map.question}</h2>
        <div className="institution-picker">
          <label htmlFor={`izbor-${map.id}`}>Полазиште на мапи</label>
          <Select
            value={selected}
            onValueChange={(value) => {
              if (value) setSelected(value);
            }}
            items={map.nodes.map(({ id, name }) => ({
              value: id,
              label: name,
            }))}
          >
            <SelectTrigger
              id={`izbor-${map.id}`}
              aria-label="Полазиште на мапи"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {map.nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <figure className="institution-figure">
        <figcaption>
          <Network size={17} aria-hidden="true" />
          <span>Изаберите везу за објашњење или име за повезане учеснике.</span>
        </figcaption>
        <div className="institution-network">
          <article
            className="institution-focus"
            aria-labelledby={`ucesnik-${map.id}`}
          >
            <h3 id={`ucesnik-${map.id}`} ref={heading} tabIndex={-1}>
              {focus.name}
            </h3>
            <p>{focus.summary}</p>
            {focus.relatedMap && (
              <p>
                <a className="text-link" href={`#${focus.relatedMap.id}`}>
                  {focus.relatedMap.label}
                </a>
              </p>
            )}
            <InstitutionSources sources={focus.sources} />
          </article>
          <ul
            className="institution-branches"
            aria-label={`Везе за учесника — ${focus.name}`}
          >
            {edges.map((edge) => (
              <Relationship
                key={`${edge.from}-${edge.to}-${edge.label}`}
                edge={edge}
                from={nodes.get(edge.from)!}
                to={nodes.get(edge.to)!}
                outgoing={edge.from === selected}
                onExplore={explore}
              />
            ))}
          </ul>
        </div>
      </figure>
    </>
  );
}

export function InstitutionExplorer({ maps }: { maps: InstitutionMap[] }) {
  const hash = useInstitutionFragment();
  const active = maps.find((map) => map.id === hash) ?? maps[0];
  return (
    <Tabs value={active.id}>
      <TabsList variant="line" aria-label="Теме мапе">
        {maps.map((map) => (
          <TabsTrigger
            key={map.id}
            id={map.id}
            className="institution-topic-anchor"
            value={map.id}
            render={<a href={`#${map.id}`} />}
          >
            {map.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {maps.map((map) => (
        <TabsContent key={map.id} value={map.id} aria-labelledby={map.id}>
          <TopicMap map={map} />
          {map.procedure && (
            <Procedure id={`postupak-${map.id}`} procedure={map.procedure} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
