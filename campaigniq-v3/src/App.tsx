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
        <RouterProvider router={router} />
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
        { path: '*', element: <Navigate to={home} replace /> },
      ],
    },
  ]);
}
