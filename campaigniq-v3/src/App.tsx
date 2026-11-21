import { useMemo, useState } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { LoginPage } from './auth/login';
import { isBuilt } from './auth/nav';
import { loadSession, saveSession, type Session } from './auth/session';
import { Shell } from './shell/Shell';
import { BhStoreProvider } from './store/bhStore';
import { CommandCentre } from './screens/CommandCentre';
import { Portfolio } from './screens/Portfolio';
import { RegionalPerformance } from './screens/RegionalPerformance';
import { TerritoryPerformance } from './screens/TerritoryPerformance';
import { Effectiveness } from './screens/Effectiveness';
import { CampaignInvestment, CommercialReturns, InvestmentRoi, Reallocation } from './screens/Investment';
import { MarketOpportunity, ThemeInbox, ThemeReview } from './screens/Themes';
import { ActionTracker, DecisionAssistant, PortfolioLearning } from './screens/Interventions';

/** A session opens the Business Head workspace when it is the master login or a Business Head login. */
const canOpen = (s: Session | null) => !!s && (s.master || isBuilt(s.persona));

export function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    return canOpen(s) ? s : null;
  });
  const [loginKey, setLoginKey] = useState(0);

  const router = useMemo(() => (session ? buildRouter(session.name, () => { saveSession(null); setSession(null); }) : null), [session]);

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
      <RouterProvider router={router} />
    </BhStoreProvider>
  );
}

function buildRouter(userName: string, signOut: () => void) {
  return createHashRouter([
    {
      path: '/',
      element: <Shell userName={userName} onSignOut={signOut} />,
      children: [
        { index: true, element: <Navigate to="/bh/command-centre" replace /> },
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
        { path: '*', element: <Navigate to="/bh/command-centre" replace /> },
      ],
    },
  ]);
}
