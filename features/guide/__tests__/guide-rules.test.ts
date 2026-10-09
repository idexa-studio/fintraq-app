import { INSIGHTS_OPENED, WHATS_NEW_RELEASE, parseSeen, showsWhatsNew, withSeen, withoutTips } from '@/features/guide/guide-rules';

describe('parseSeen', () => {
  it('reads the saved list, and treats anything else as nothing seen', () => {
    expect(parseSeen('["activity","plan"]')).toEqual(['activity', 'plan']);
    expect(parseSeen(null)).toEqual([]);
    expect(parseSeen('not json')).toEqual([]);
    expect(parseSeen('{"activity":true}')).toEqual([]);
    expect(parseSeen('["plan",3]')).toEqual(['plan']);
  });
});

describe('withSeen', () => {
  it('adds a name once', () => {
    expect(withSeen([], 'plan')).toEqual(['plan']);
    expect(withSeen(['plan'], 'plan')).toEqual(['plan']);
  });
});

describe('withoutTips', () => {
  it('brings the tips back and keeps what was done', () => {
    expect(withoutTips(['activity', INSIGHTS_OPENED, 'plan'])).toEqual([INSIGHTS_OPENED]);
  });
});

describe('showsWhatsNew', () => {
  it('is for an install that was here before this release', () => {
    expect(showsWhatsNew(null)).toBe(true);
    expect(showsWhatsNew(String(WHATS_NEW_RELEASE - 1))).toBe(true);
  });

  it('stays away once seen, and from an install set up on this release', () => {
    expect(showsWhatsNew(String(WHATS_NEW_RELEASE))).toBe(false);
    expect(showsWhatsNew(String(WHATS_NEW_RELEASE + 1))).toBe(false);
  });
});
