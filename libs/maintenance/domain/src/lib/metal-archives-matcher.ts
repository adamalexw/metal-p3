import { MetalArchivesUrl } from '@metal-p3/api-interfaces';

export type MatcherResult = 'none' | 'multiple' | 'success' | 'error';

export interface UrlMatcher extends MetalArchivesUrl {
  id: number;
  bandId: number;
  band: string;
  album: string;
  result?: MatcherResult;
  complete?: boolean;
  error?: unknown;
}
