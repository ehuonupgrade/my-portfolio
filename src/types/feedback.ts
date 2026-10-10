export type FeedbackCategory =
  | 'general'
  | 'toddler-activities'
  | 'bart-planner'
  | 'roboinvestor'
  | 'cosmic-game'
  | 'ui-design'
  | 'performance';

export type FeedbackType = 'feature_request' | 'bug_report' | 'ux_improvement' | 'data_source' | 'other';

export type FeasibilityRating = 'high' | 'medium' | 'low' | 'pending';

export type FeedbackStatus =
  | 'submitted'      // Logged in inventory
  | 'acknowledged'   // Reviewed & acknowledged by development staff / site owner
  | 'in_pipeline'    // Synthesized into automated roadmap / agent queue
  | 'approved'       // Feasibility verified & approved for deployment
  | 'deployed'       // Implemented on live site
  | 'deferred';      // Logged but on hold

export interface AgentEvolutionAnalysis {
  feasibilityScore: number; // 0-100
  technicalImpact: 'low' | 'medium' | 'high';
  estimatedComplexity: 'trivial' | 'moderate' | 'complex';
  proposedChangeSpec?: string;
  automatedTestPlan?: string;
  agenticReadiness: boolean; // Ready for recursive auto-agent synthesis
  reviewedByOwner: boolean;
  ownerNotes?: string;
  deployedCommit?: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  categoryLabel: string;
  type: FeedbackType;
  submittedBy: string;
  email?: string;
  submittedAt: string;
  targetPageOrComponent: string;
  upvotes: number;
  status: FeedbackStatus;
  feasibility: FeasibilityRating;
  feasibilityRationale?: string;
  agentAnalysis: AgentEvolutionAnalysis;
  deployedAt?: string;
}
