import { demoRepository } from './demo';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type {
  Agency,
  Agent,
  Lead,
  Appointment,
  Candidate,
  Campaign,
  ContentAsset,
  AuditLog,
  LeadEvent,
  CandidateEvent,
  DashboardMetrics,
} from '@/lib/types';

// Unified repository interface — demo and Supabase implementations share this contract.
// The app calls `repo` everywhere; the active implementation is chosen here.
// When Supabase is fully connected with auth, swap to the Supabase repository.

export interface IRepository {
  isDemo: boolean;
  getAgency(): Promise<Agency>;
  getAgents(): Promise<Agent[]>;
  getLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | null>;
  getLeadEvents(leadId: string): Promise<LeadEvent[]>;
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByLead(leadId: string): Promise<Appointment[]>;
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | null>;
  getCandidateEvents(candidateId: string): Promise<CandidateEvent[]>;
  getCampaigns(): Promise<Campaign[]>;
  getContentAssets(): Promise<ContentAsset[]>;
  getAuditLogs(): Promise<AuditLog[]>;
  createLead(data: Partial<Lead>): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null>;
  createAppointment(data: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null>;
  createCandidate(data: Partial<Candidate>): Promise<Candidate>;
  updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null>;
  updateContentStatus(id: string, status: string): Promise<ContentAsset | null>;
  createContentAsset(data: Partial<ContentAsset>): Promise<ContentAsset>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

// Currently using demo repository — Supabase schema and RLS are defined in migrations
// and can be activated by switching to the Supabase repository implementation.
export const repo: IRepository = demoRepository;

export const isDemoMode = !isSupabaseConfigured || true; // demo-first per requirement
