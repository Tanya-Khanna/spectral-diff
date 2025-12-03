// Risk engine types

export type Severity = "info" | "warn" | "critical";
export type Band = "bright" | "dim" | "dark" | "cursed";

export interface RiskSignal {
  key: string;
  label: string;
  points: number;
  severity: Severity;
}

export interface RoomRiskResult {
  score: number;
  band: Band;
  signals: RiskSignal[];
  criticalFindings: string[];
  notes: string[];
}

export type WorkflowRule = "UNPINNED_ACTION" | "BROAD_PERMISSIONS" | "PR_TARGET_WITH_WRITE";

export interface WorkflowFinding {
  rule: WorkflowRule;
  severity: "critical";
  message: string;
  evidence?: string;
}

export type FogIntensity = "none" | "low" | "med" | "high";
export type ScratchStyle = "small" | "medium" | "pulse" | "bleed";

export interface RiskSigil {
  type: "warning" | "critical";
  label: string;
}

export interface RiskVisual {
  band: Band;
  darknessClass: string;
  fogIntensity: FogIntensity;
  scratchStyle: ScratchStyle;
  sigils: RiskSigil[];
  distortion: boolean;
}
