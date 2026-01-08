export type NLPQuestionKey =
  | 'positive'
  | 'specific'
  | 'evidence'
  | 'resources'
  | 'obstacles'
  | 'ecology'
  | 'timeline'
  | 'firstStep';

export const nlpQuestionOrder: NLPQuestionKey[] = [
  'positive',
  'specific',
  'evidence',
  'resources',
  'obstacles',
  'ecology',
  'timeline',
  'firstStep',
];

export type NLPAnswers = { [K in NLPQuestionKey]?: string };
