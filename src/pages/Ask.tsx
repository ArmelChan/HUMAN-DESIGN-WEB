import { QuestionGuide } from '../components/QuestionGuide';
import { Callout } from '../components/Common';
import { DISCLAIMER } from '../data/disclaimer';

export function AskPage() {
  return (
    <div className="page">
      <h1>
        提問指引
        <span className="h1-sub">常見問題的固定回覆，包括健康、心理與授權方面的界線</span>
      </h1>
      <Callout title="使用前說明">
        <p>{DISCLAIMER}</p>
      </Callout>
      <QuestionGuide headingId="ask-page-h" />
    </div>
  );
}
