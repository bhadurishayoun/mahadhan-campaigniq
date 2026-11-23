import { useMemo, useState } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LoginPage } from './auth/login';
import { isBuilt } from './auth/nav';
import { loadSession, saveSession, type Session } from './auth/session';
import { Shell } from './shell/Shell';
import { BhStoreProvider } from './store/bhStore';
import { FsmStoreProvider } from './store/fsmStore';
import { LANDING } from './routes';
import { CropPlanning, MyPerformance, OutletPlanning, PlanReview, TerritoryNetwork } from './screens/fsm/Plan';
import { SelectPriority, WizardActivities, WizardObjective, WizardReview, WizardScenario } from './screens/fsm/Campaigns';
import { ActivityExecution, ControlTower } from './screens/fsm/Execution';
import { CampaignImpact, VillageDiagnostic } from './screens/fsm/Impact';
import { FsmAssistant } from './screens/fsm/Assistant';
import { CampaignDiagnostics, CampaignPerformance, PerformanceDetail, Recommendations, ZmAssistant } from './screens/zm/Impact';
import { ApprovalInbox, TerritoryActivityReview } from './screens/zm/Approvals';
import { AudienceReconciliation, BusinessCase, ProposalReview, ProposalRevision, ScenarioSimulator } from './screens/zm/Business';
import { CollateralApprovals, CollateralEditor, CollateralTemplates, PlaybookRelease, VersionComparison } from './screens/zm/Collateral';
import { AssignedThemes, ConceptComparison, ConceptStudio, PropositionDesigner } from './screens/zm/Studio';
import { ConsolidatedPlans, PlanValidation, RevisedPlan, SkuReconciliation, ZmPerformance } from './screens/zm/Plans';
import { ZmStoreProvider } from './store/zmStore';
import { MhBlank } from './screens/mh/Blank';
import { MhStoreProvider } from './store/mhStore';
import { CommandCentre } from './screens/CommandCentre';
import { Portfolio } from './screens/Portfolio';
import { RegionalPerformance } from './screens/RegionalPerformance';
import { TerritoryPerformance } from './screens/TerritoryPerformance';
import { Effectiveness } from './screens/Effectiveness';
import { CampaignInvestment, CommercialReturns, InvestmentRoi, Reallocation } from './screens/Investment';
import { MarketOpportunity, ThemeInbox, ThemeReview } from './screens/Themes';
import { ActionTracker, DecisionAssistant, PortfolioLearning } from './screens/Interventions';

/** A session opens the app when it is the master login or a login for a built persona. */
const canOpen = (s: Session | null) => !!s && (s.master || isBuilt(s.persona));

export function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    return canOpen(s) ? s : null;
  });
  const [loginKey, setLoginKey] = useState(0);

  const router = useMemo(() => (session ? buildRouter(session, () => { saveSession(null); setSession(null); }) : null), [session]);

  if (!session || !router) {
    return (
      <LoginPage
        key={loginKey}
        initialPersona="strategy"
        onLogin={(p) => {
          const s: Session = { name: p.name, persona: p.persona, userId: p.userId, master: p.master };
          if (!canOpen(s)) { setLoginKey((k) => k + 1); return; }
          saveSession(s);
          setSession(s);
        }}
      />
    );
  }

  return (
    <BhStoreProvider>
      <FsmStoreProvider>
        <ZmStoreProvider>
          <MhStoreProvider>
            <RouterProvider router={router} />
          </MhStoreProvider>
        </ZmStoreProvider>
      </FsmStoreProvider>
    </BhStoreProvider>
  );
}

function buildRouter(session: Session, signOut: () => void) {
  const home = LANDING[session.persona] ?? LANDING.strategy;
  return createHashRouter([
    {
      path: '/',
      element: <Shell session={session} onSignOut={signOut} />,
      children: [
        { index: true, element: <Navigate to={home} replace /> },
        { path: 'bh/command-centre', element: <CommandCentre /> },
        { path: 'bh/portfolio', element: <Portfolio /> },
        { path: 'bh/portfolio/region/:region', element: <RegionalPerformance /> },
        { path: 'bh/portfolio/region/:region/effectiveness', element: <Effectiveness /> },
        { path: 'bh/portfolio/territory/:territory', element: <TerritoryPerformance /> },
        { path: 'bh/investment', element: <InvestmentRoi /> },
        { path: 'bh/investment/region/:region', element: <CampaignInvestment /> },
        { path: 'bh/investment/region/:region/returns', element: <CommercialReturns /> },
        { path: 'bh/investment/region/:region/reallocation', element: <Reallocation /> },
        { path: 'bh/themes/opportunity', element: <MarketOpportunity /> },
        { path: 'bh/themes/inbox', element: <ThemeInbox /> },
        { path: 'bh/themes/:themeId/review', element: <ThemeReview /> },
        { path: 'bh/interventions', element: <ActionTracker /> },
        { path: 'bh/interventions/learning', element: <PortfolioLearning /> },
        { path: 'bh/assistant', element: <DecisionAssistant /> },
        { path: 'fsm/plan', element: <MyPerformance /> },
        { path: 'fsm/plan/network/:territory', element: <TerritoryNetwork /> },
        { path: 'fsm/plan/outlets/:territory', element: <OutletPlanning /> },
        { path: 'fsm/plan/crop/:territory', element: <CropPlanning /> },
        { path: 'fsm/plan/review/:territory', element: <PlanReview /> },
        { path: 'fsm/campaigns', element: <SelectPriority /> },
        { path: 'fsm/campaigns/new/objective', element: <WizardObjective /> },
        { path: 'fsm/campaigns/new/activities', element: <WizardActivities /> },
        { path: 'fsm/campaigns/new/scenario', element: <WizardScenario /> },
        { path: 'fsm/campaigns/new/review', element: <WizardReview /> },
        { path: 'fsm/execution', element: <ControlTower /> },
        { path: 'fsm/execution/:activityId', element: <ActivityExecution /> },
        { path: 'fsm/impact', element: <CampaignImpact /> },
        { path: 'fsm/impact/diagnostic', element: <VillageDiagnostic /> },
        { path: 'fsm/assistant', element: <FsmAssistant /> },
        { path: 'zm/performance', element: <ZmPerformance /> },
        { path: 'zm/plans', element: <ConsolidatedPlans /> },
        { path: 'zm/plans/reconciliation', element: <SkuReconciliation /> },
        { path: 'zm/plans/:territory/review', element: <PlanValidation /> },
        { path: 'zm/plans/:territory/revised', element: <RevisedPlan /> },
        { path: 'zm/themes', element: <AssignedThemes /> },
        { path: 'zm/studio/concepts', element: <ConceptStudio /> },
        { path: 'zm/studio/compare', element: <ConceptComparison /> },
        { path: 'zm/studio/proposition', element: <PropositionDesigner /> },
        { path: 'zm/studio/collateral', element: <CollateralTemplates /> },
        { path: 'zm/studio/collateral/edit', element: <CollateralEditor /> },
        { path: 'zm/studio/collateral/versions', element: <VersionComparison /> },
        { path: 'zm/studio/collateral/approvals', element: <CollateralApprovals /> },
        { path: 'zm/studio/playbook', element: <PlaybookRelease /> },
        { path: 'zm/studio/business-case', element: <BusinessCase /> },
        { path: 'zm/studio/scenarios', element: <ScenarioSimulator /> },
        { path: 'zm/studio/reconciliation', element: <AudienceReconciliation /> },
        { path: 'zm/studio/proposals', element: <ProposalReview /> },
        { path: 'zm/studio/proposals/:id/revise', element: <ProposalRevision /> },
        { path: 'zm/approvals', element: <ApprovalInbox /> },
        { path: 'zm/approvals/:territory', element: <TerritoryActivityReview /> },
        { path: 'zm/impact', element: <CampaignPerformance /> },
        { path: 'zm/impact/detail', element: <PerformanceDetail /> },
        { path: 'zm/impact/diagnostics', element: <CampaignDiagnostics /> },
        { path: 'zm/impact/recommendations', element: <Recommendations /> },
        { path: 'zm/assistant', element: <ZmAssistant /> },
        { path: 'mh/overview', element: <MhBlank n={1} /> },
        { path: 'mh/opportunity/:region', element: <MhBlank n={2} /> },
        { path: 'mh/plans', element: <MhBlank n={3} /> },
        { path: 'mh/plans/:region/:crop', element: <MhBlank n={4} /> },
        { path: 'mh/plans/territory/:territory', element: <MhBlank n={5} /> },
        { path: 'mh/studio/diagnosis', element: <MhBlank n={6} /> },
        { path: 'mh/studio/recommendations', element: <MhBlank n={7} /> },
        { path: 'mh/studio/investigation', element: <MhBlank n={8} /> },
        { path: 'mh/studio/evidence', element: <MhBlank n={9} /> },
        { path: 'mh/studio/investigation/updated', element: <MhBlank n={10} /> },
        { path: 'mh/studio/recommendations/refreshed', element: <MhBlank n={11} /> },
        { path: 'mh/studio/theme-brief', element: <MhBlank n={12} /> },
        { path: 'mh/studio/themes', element: <MhBlank n={13} /> },
        { path: 'mh/approvals/proposals', element: <MhBlank n={14} /> },
        { path: 'mh/approvals/proposals/:id', element: <MhBlank n={15} /> },
        { path: 'mh/approvals/compare', element: <MhBlank n={16} /> },
        { path: 'mh/approvals/:id/decision', element: <MhBlank n={17} /> },
        { path: 'mh/approvals/:id/rollout', element: <MhBlank n={18} /> },
        { path: 'mh/performance', element: <MhBlank n={19} /> },
        { path: 'mh/performance/:region', element: <MhBlank n={20} /> },
        { path: 'mh/performance/:region/drivers', element: <MhBlank n={21} /> },
        { path: 'mh/assistant', element: <MhBlank n={22} /> },
        { path: '*', element: <Navigate to={home} replace /> },
      ],
    },
  ]);
}
