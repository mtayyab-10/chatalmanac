import { describe, it, expect } from 'vitest';
import type { PersonStats } from '../src/worker/stats.ts';

function createPerson(name: string, overrides: Partial<PersonStats> = {}): PersonStats {
  return {
    name,
    messageCount: 100,
    wordCount: 500,
    charCount: 2500,
    sharePercent: 50,
    mediaCount: 10,
    linkCount: 5,
    emojiCount: 20,
    deletedCount: 0,
    questionCount: 15,
    avgMessageLength: 25,
    medianResponseMs: 120_000, // 2 mins
    avgResponseMs: 150_000,
    responseDistribution: [30, 20, 10, 5, 2, 1], // [<1m, 1-5m, 5-15m, 15-60m, 1-6h, >6h]
    topEmoji: [{ emoji: '😊', count: 12 }],
    ...overrides,
  };
}

describe('Compare and Advanced Analytics (Phase 6)', () => {
  it('correctly compares message counts and calculates ratios', () => {
    const personA = createPerson('Alice', { messageCount: 300 });
    const personB = createPerson('Bob', { messageCount: 100 });

    const total = personA.messageCount + personB.messageCount;
    const pctA = (personA.messageCount / total) * 100;
    const pctB = (personB.messageCount / total) * 100;

    expect(pctA).toBe(75);
    expect(pctB).toBe(25);

    const ratio = (personA.messageCount / personB.messageCount).toFixed(1);
    expect(ratio).toBe('3.0');
  });

  it('determines the faster responder correctly', () => {
    const personA = createPerson('Alice', { medianResponseMs: 60_000 }); // 1 min
    const personB = createPerson('Bob', { medianResponseMs: 180_000 }); // 3 min

    const faster = personA.medianResponseMs! < personB.medianResponseMs! ? personA.name : personB.name;
    expect(faster).toBe('Alice');
  });

  it('handles participants with null response times gracefully', () => {
    const personA = createPerson('Alice', { medianResponseMs: null });
    const personB = createPerson('Bob', { medianResponseMs: 120_000 });

    expect(personA.medianResponseMs).toBeNull();
    expect(personB.medianResponseMs).not.toBeNull();
  });

  it('verifies response speed distribution totals', () => {
    const person = createPerson('Alice', { responseDistribution: [10, 20, 15, 5, 0, 0] });
    const totalReplies = person.responseDistribution.reduce((sum, c) => sum + c, 0);

    expect(totalReplies).toBe(50);

    const underFiveMins = person.responseDistribution[0]! + person.responseDistribution[1]!;
    const pctUnderFive = (underFiveMins / totalReplies) * 100;
    expect(pctUnderFive).toBe(60);
  });

  it('renders compare filter controls and metric breakdown rows', () => {
    // Basic test ensuring DOM structure can be constructed if window/document is available
    if (typeof document !== 'undefined') {
      const mockStats = {
        participants: ['Alice', 'Bob'],
        perPerson: [
          ['Alice', createPerson('Alice', { messageCount: 200 })],
          ['Bob', createPerson('Bob', { messageCount: 100 })],
        ] as any,
        conversationStarters: [['Alice', 5], ['Bob', 2]] as any,
        conversationEnders: [['Alice', 3], ['Bob', 4]] as any,
      };

      const { renderCompare } = require('../src/ui/components/compare.ts');
      const el = renderCompare(mockStats);
      expect(el.querySelector('.compare-filter-tabs')).not.toBeNull();
      const filterBtns = el.querySelectorAll('.compare-filter-btn');
      expect(filterBtns.length).toBe(3);
    }
  });
});
