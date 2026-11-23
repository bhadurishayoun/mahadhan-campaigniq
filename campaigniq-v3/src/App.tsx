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
import { ZmBlank } from './screens/zm/Blank';
import { ZmStoreProvider } from './store/zmStore';
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
          <RouterProvider router={router} />
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
        { path: 'zm/performance', element: <ZmBlank n={1} /> },
        { path: 'zm/plans', element: <ZmBlank n={2} /> },
        { path: 'zm/plans/reconciliation', element: <ZmBlank n={3} /> },
        { path: 'zm/plans/:territory/review', element: <ZmBlank n={4} /> },
        { path: 'zm/plans/:territory/revised', element: <ZmBlank n={5} /> },
        { path: 'zm/themes', element: <ZmBlank n={6} /> },
        { path: 'zm/studio/concepts', element: <ZmBlank n={7} /> },
        { path: 'zm/studio/compare', element: <ZmBlank n={8} /> },
        { path: 'zm/studio/proposition', element: <ZmBlank n={9} /> },
        { path: 'zm/studio/collateral', element: <ZmBlank n={10} /> },
        { path: 'zm/studio/collateral/edit', element: <ZmBlank n={11} /> },
        { path: 'zm/studio/collateral/versions', element: <ZmBlank n={12} /> },
        { path: 'zm/studio/collateral/approvals', element: <ZmBlank n={13} /> },
        { path: 'zm/studio/playbook', element: <ZmBlank n={14} /> },
        { path: 'zm/studio/business-case', element: <ZmBlank n={15} /> },
        { path: 'zm/studio/scenarios', element: <ZmBlank n={16} /> },
        { path: 'zm/studio/reconciliation', element: <ZmBlank n={17} /> },
        { path: 'zm/studio/proposals', element: <ZmBlank n={18} /> },
        { path: 'zm/studio/proposals/:id/revise', element: <ZmBlank n={19} /> },
        { path: 'zm/approvals', element: <ZmBlank n={20} /> },
        { path: 'zm/approvals/:territory', element: <ZmBlank n={21} /> },
        { path: 'zm/impact', element: <ZmBlank n={22} /> },
        { path: 'zm/impact/detail', element: <ZmBlank n={23} /> },
        { path: 'zm/impact/diagnostics', element: <ZmBlank n={24} /> },
        { path: 'zm/impact/recommendations', element: <ZmBlank n={25} /> },
        { path: 'zm/assistant', element: <ZmBlank n={26} /> },
        { path: '*', element: <Navigate to={home} replace /> },
      ],
    },
  ]);
}
