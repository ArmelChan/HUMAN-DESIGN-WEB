import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react';
import { useRoute, type Route } from './lib/router';
import { HomePage } from './pages/Home';
import { IntroPage } from './pages/Intro';
import { CenterDetailPage, CentersPage } from './pages/Centers';
import { TypesPage } from './pages/Types';
import { ProfilesPage } from './pages/Profiles';
import { ChannelsPage } from './pages/Channels';
import { GatesPage } from './pages/Gates';
import { LabPage } from './pages/Lab';
import { GlossaryPage } from './pages/Glossary';
import { SourcesPage } from './pages/Sources';
import { NotFoundBlock } from './components/Common';
import { CopyrightPage, PrivacyPage, TermsPage } from './pages/Legal';
import { AskPage } from './pages/Ask';
import { DISCLAIMER } from './data/disclaimer';

// 排圖頁含天文計算函式庫，延遲載入以免拖慢其他頁面。
const ChartPage = lazy(() => import('./pages/Chart').then((m) => ({ default: m.ChartPage })));
const VerificationPage = lazy(() => import('./pages/Verification').then((m) => ({ default: m.VerificationPage })));

class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="page">
          <div className="empty" role="alert">
            <p>計算模組載入失敗，可能是網路中斷。請重新整理頁面再試一次。</p>
          </div>
        </div>
      );
    return this.props.children;
  }
}

const NAV: { href: string; label: string; match: string }[] = [
  { href: '#/', label: '圖像探索', match: '' },
  { href: '#/chart', label: '個人排圖', match: 'chart' },
  { href: '#/intro', label: '入門', match: 'intro' },
  { href: '#/centers', label: '能量中心', match: 'centers' },
  { href: '#/types', label: '類型與權威', match: 'types' },
  { href: '#/profiles', label: '人生角色', match: 'profiles' },
  { href: '#/channels', label: '通道', match: 'channels' },
  { href: '#/gates', label: '閘門', match: 'gates' },
  { href: '#/lab', label: '規則實驗室', match: 'lab' },
  { href: '#/glossary', label: '詞彙', match: 'glossary' },
  { href: '#/ask', label: '提問指引', match: 'ask' },
  { href: '#/verification', label: '計算驗證', match: 'verification' },
  { href: '#/sources', label: '來源', match: 'sources' },
];

function renderPage(route: Route): { title: string; node: ReactNode } {
  const [section, param] = route.path;
  switch (section ?? '') {
    case '':
      return { title: '圖像探索', node: <HomePage route={route} /> };
    case 'chart':
      return {
        title: '個人排圖',
        node: (
          <LoadBoundary>
            <Suspense fallback={<div className="page"><p role="status">正在載入計算模組…</p></div>}>
              <ChartPage />
            </Suspense>
          </LoadBoundary>
        ),
      };
    case 'verification':
      return {
        title: '計算驗證',
        node: (
          <LoadBoundary>
            <Suspense fallback={<div className="page"><p role="status">正在載入計算模組…</p></div>}>
              <VerificationPage />
            </Suspense>
          </LoadBoundary>
        ),
      };
    case 'terms':
      return { title: '使用條款', node: <TermsPage /> };
    case 'privacy':
      return { title: '隱私聲明', node: <PrivacyPage /> };
    case 'copyright':
      return { title: '版權與使用指引', node: <CopyrightPage /> };
    case 'ask':
      return { title: '提問指引', node: <AskPage /> };
    case 'intro':
      return { title: '人類圖入門', node: <IntroPage /> };
    case 'centers':
      return param
        ? { title: '能量中心', node: <CenterDetailPage id={param} /> }
        : { title: '能量中心', node: <CentersPage /> };
    case 'types':
      return { title: '類型、策略與內在權威', node: <TypesPage anchor={route.anchor} /> };
    case 'profiles':
      return { title: '人生角色', node: <ProfilesPage route={route} /> };
    case 'channels':
      return { title: '通道', node: <ChannelsPage route={route} param={param} /> };
    case 'gates':
      return { title: '閘門', node: <GatesPage route={route} param={param} /> };
    case 'lab':
      return { title: '規則實驗室', node: <LabPage route={route} /> };
    case 'glossary':
      return { title: '詞彙與譯名', node: <GlossaryPage /> };
    case 'sources':
      return { title: '來源與編輯註記', node: <SourcesPage /> };
    default:
      return { title: '找不到頁面', node: <NotFoundBlock what="這個頁面" /> };
  }
}

export function App() {
  const route = useRoute();
  const { title, node } = renderPage(route);
  const section = route.path[0] ?? '';
  const pageKey = route.path.join('/');

  useEffect(() => {
    document.title = section ? `${title}｜人類圖圖解` : '人類圖圖解｜以圖像認識人類圖';
  }, [title, section]);

  // 換頁時回到頂端並把焦點移到主內容；同頁內更新選取（只改查詢參數）時不動。
  useEffect(() => {
    if (route.anchor) {
      document.getElementById(route.anchor)?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pageKey]);

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        跳到主要內容
      </a>
      <header className="site-header">
        <a className="brand" href="#/">
          <svg width="22" height="30" viewBox="0 0 22 30" aria-hidden="true">
            <path d="M11 1 L19 9 H3 Z M3 12 H19 L11 20 Z M5 22 H17 V29 H5 Z" />
          </svg>
          人類圖圖解
        </a>
        <nav aria-label="主要導覽">
          <ul className="nav">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} aria-current={section === n.match ? 'page' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        {node}
      </main>
      <footer className="site-footer">
        <p>{DISCLAIMER}</p>
        <nav aria-label="條款與政策" className="footer-links">
          <a href="#/terms">使用條款（草稿）</a>
          <a href="#/privacy">隱私聲明（草稿）</a>
          <a href="#/copyright">版權與使用指引</a>
          <a href="#/sources">來源與第三方授權</a>
          <a href="#/verification">計算驗證</a>
        </nav>
        <p>
          BodyGraph 為本站自行繪製的示意圖。「Human Design」相關名稱與原始教材的權利屬於各自的權利人；本站不是 Jovian Archive 的官方網站，不使用其標誌或認證字樣。
        </p>
      </footer>
    </>
  );
}
