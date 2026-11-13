"use client";
import { useEffect } from "react";
import { createAgent, registerTools } from "@ui-sdk/react/agent";

let bridge: ReturnType<typeof createAgent> | undefined;

// Development tooling only; native navigation and static readers need no bridge.
export function UIAgentBridge() {
  useEffect(() => {
    bridge ??= createAgent();
    return registerTools(bridge, { allow: (step) => !step.confirm });
  }, []);
  return null;
}
