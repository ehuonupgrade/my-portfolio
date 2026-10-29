import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GameStatusBadge, getGameDisplayStatus } from './GameStatusBadge';

describe('getGameDisplayStatus', () => {
  it('handles missing, null, or empty game object gracefully', () => {
    const defaultRes = getGameDisplayStatus();
    assert.strictEqual(defaultRes.status, 'UPCOMING');
    assert.strictEqual(defaultRes.label, 'Upcoming');
    assert.strictEqual(defaultRes.shortLabel, 'UPCOMING');
    assert.strictEqual(defaultRes.isUpcoming, true);
    assert.strictEqual(defaultRes.isLive, false);
    assert.strictEqual(defaultRes.isCompleted, false);
    assert.strictEqual(defaultRes.icon, '⏳');
    assert.strictEqual(defaultRes.detail, 'Scheduled');

    const nullRes = getGameDisplayStatus(null);
    assert.strictEqual(nullRes.status, 'UPCOMING');

    const emptyRes = getGameDisplayStatus({});
    assert.strictEqual(emptyRes.status, 'UPCOMING');
    assert.strictEqual(emptyRes.detail, 'Upcoming Kickoff');
  });

  describe('Completed status resolution', () => {
    it('identifies completed games by raw status values', () => {
      const finalGame = getGameDisplayStatus({ status: 'FINAL' });
      assert.strictEqual(finalGame.status, 'COMPLETED');
      assert.strictEqual(finalGame.label, 'Completed');
      assert.strictEqual(finalGame.isCompleted, true);
      assert.strictEqual(finalGame.icon, '✓');

      const completedGame = getGameDisplayStatus({ status: 'COMPLETED' });
      assert.strictEqual(completedGame.status, 'COMPLETED');
    });

    it('identifies completed games by status category or status state', () => {
      const catGame = getGameDisplayStatus({ gameStatusCategory: 'completed' });
      assert.strictEqual(catGame.status, 'COMPLETED');

      const stateGame = getGameDisplayStatus({ statusState: 'post' });
      assert.strictEqual(stateGame.status, 'COMPLETED');
    });

    it('identifies completed games by scheduledTime or statusDetail keywords', () => {
      const schedGame = getGameDisplayStatus({ scheduledTime: 'Final - Oct 12' });
      assert.strictEqual(schedGame.status, 'COMPLETED');

      const detailGame = getGameDisplayStatus({ statusDetail: 'Settled after review' });
      assert.strictEqual(detailGame.status, 'COMPLETED');
    });

    it('formats scoreSummary for completed games', () => {
      const gameWithScores = getGameDisplayStatus({
        status: 'FINAL',
        scores: { home: 24, away: 17 },
        homeTeam: { abbr: 'KC' },
        awayTeam: { abbr: 'SF' },
      });
      assert.strictEqual(gameWithScores.scoreSummary, 'KC 24 - 17 SF');

      const gameDefaultAbbr = getGameDisplayStatus({
        status: 'FINAL',
        scores: { home: 10, away: 3 },
      });
      assert.strictEqual(gameDefaultAbbr.scoreSummary, 'HOM 10 - 3 AWY');

      const gameNoScores = getGameDisplayStatus({ status: 'FINAL' });
      assert.strictEqual(gameNoScores.scoreSummary, undefined);
    });

    it('falls back to detail string appropriately for completed games', () => {
      const withDetail = getGameDisplayStatus({ status: 'FINAL', statusDetail: 'Final (OT)' });
      assert.strictEqual(withDetail.detail, 'Final (OT)');

      const withSched = getGameDisplayStatus({ status: 'FINAL', scheduledTime: '2025-01-01' });
      assert.strictEqual(withSched.detail, '2025-01-01');

      const fallback = getGameDisplayStatus({ status: 'FINAL' });
      assert.strictEqual(fallback.detail, 'Final');
    });
  });

  describe('In Progress status resolution', () => {
    it('identifies in-progress games by raw status values', () => {
      const liveGame = getGameDisplayStatus({ status: 'LIVE' });
      assert.strictEqual(liveGame.status, 'IN_PROGRESS');
      assert.strictEqual(liveGame.label, 'In Progress');
      assert.strictEqual(liveGame.isLive, true);
      assert.strictEqual(liveGame.icon, '⚡');

      const progressGame = getGameDisplayStatus({ status: 'IN_PROGRESS' });
      assert.strictEqual(progressGame.status, 'IN_PROGRESS');
    });

    it('identifies in-progress games by category or state', () => {
      const catGame = getGameDisplayStatus({ gameStatusCategory: 'in progress' });
      assert.strictEqual(catGame.status, 'IN_PROGRESS');

      const stateGame = getGameDisplayStatus({ statusState: 'in' });
      assert.strictEqual(stateGame.status, 'IN_PROGRESS');
    });

    it('identifies in-progress games by statusDetail keywords', () => {
      const quarters = ['q1', 'q2', 'q3', 'q4', 'halftime', 'ot'];
      quarters.forEach((q) => {
        const res = getGameDisplayStatus({ statusDetail: `3:45 remaining in ${q}` });
        assert.strictEqual(res.status, 'IN_PROGRESS', `Failed for quarter detail: ${q}`);
      });
    });

    it('identifies in-progress games by active non-completed scores', () => {
      const activeScores = getGameDisplayStatus({
        scores: { home: 7, away: 0 },
      });
      assert.strictEqual(activeScores.status, 'IN_PROGRESS');
    });

    it('formats scoreSummary for in-progress games', () => {
      const liveWithScores = getGameDisplayStatus({
        status: 'LIVE',
        scores: { home: 21, away: 14 },
        homeTeam: { abbr: 'BAL' },
        awayTeam: { abbr: 'PIT' },
      });
      assert.strictEqual(liveWithScores.scoreSummary, 'PIT 14 @ BAL 21');

      const liveDefaultAbbr = getGameDisplayStatus({
        status: 'LIVE',
        scores: { home: 14, away: 7 },
      });
      assert.strictEqual(liveDefaultAbbr.scoreSummary, 'AWY 7 @ HOM 14');
    });

    it('falls back to detail string appropriately for in-progress games', () => {
      const withDetail = getGameDisplayStatus({ status: 'LIVE', statusDetail: 'Q3 12:44' });
      assert.strictEqual(withDetail.detail, 'Q3 12:44');

      const fallback = getGameDisplayStatus({ status: 'LIVE' });
      assert.strictEqual(fallback.detail, 'Live In-Play');
    });
  });

  describe('Upcoming status resolution', () => {
    it('returns upcoming status for non-live and non-completed games', () => {
      const game = getGameDisplayStatus({
        status: 'SCHEDULED',
        scheduledTime: '7:30 PM EST',
      });
      assert.strictEqual(game.status, 'UPCOMING');
      assert.strictEqual(game.label, 'Upcoming');
      assert.strictEqual(game.isUpcoming, true);
      assert.strictEqual(game.icon, '📅');
      assert.strictEqual(game.detail, '7:30 PM EST');
    });

    it('uses statusDetail over scheduledTime when available', () => {
      const game = getGameDisplayStatus({
        statusDetail: 'Postponed to 8PM',
        scheduledTime: '7:30 PM EST',
      });
      assert.strictEqual(game.detail, 'Postponed to 8PM');
    });
  });
});

describe('GameStatusBadge Component', () => {
  it('renders default props correctly', () => {
    const html = renderToString(React.createElement(GameStatusBadge, {}));
    assert.match(html, /Upcoming/);
    assert.match(html, /text-\[10px\]/); // sm size default
    assert.match(html, /rounded-full/); // showDot default true
    assert.doesNotMatch(html, /⏳/); // showIcon default false
  });

  describe('statusOverride handling', () => {
    it('overrides status to IN_PROGRESS for LIVE/IN_PROGRESS values', () => {
      const htmlLive = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'LIVE' })
      );
      assert.match(htmlLive, /In Progress/);
      assert.match(htmlLive, /bg-emerald-950/);

      const htmlProgress = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'IN_PROGRESS' })
      );
      assert.match(htmlProgress, /In Progress/);
    });

    it('overrides status to COMPLETED for FINAL/COMPLETED values', () => {
      const htmlFinal = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'FINAL' })
      );
      assert.match(htmlFinal, /Completed/);
      assert.match(htmlFinal, /bg-slate-950/);

      const htmlCompleted = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'COMPLETED' })
      );
      assert.match(htmlCompleted, /Completed/);
    });

    it('overrides status to UPCOMING for SCHEDULED/UPCOMING values', () => {
      const htmlSched = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'SCHEDULED' })
      );
      assert.match(htmlSched, /Upcoming/);
      assert.match(htmlSched, /bg-cyan-950/);

      const htmlUpcoming = renderToString(
        React.createElement(GameStatusBadge, { statusOverride: 'UPCOMING' })
      );
      assert.match(htmlUpcoming, /Upcoming/);
    });
  });

  describe('display toggle props', () => {
    it('hides dot when showDot is false', () => {
      const html = renderToString(
        React.createElement(GameStatusBadge, { showDot: false })
      );
      assert.doesNotMatch(html, /rounded-full/);
    });

    it('shows status icon when showIcon is true', () => {
      const htmlDefaultNoGame = renderToString(
        React.createElement(GameStatusBadge, { showIcon: true })
      );
      assert.match(htmlDefaultNoGame, /⏳/);

      const htmlLive = renderToString(
        React.createElement(GameStatusBadge, { game: { status: 'LIVE' }, showIcon: true })
      );
      assert.match(htmlLive, /⚡/);

      const htmlCompleted = renderToString(
        React.createElement(GameStatusBadge, { game: { status: 'FINAL' }, showIcon: true })
      );
      assert.match(htmlCompleted, /✓/);

      const htmlUpcomingGame = renderToString(
        React.createElement(GameStatusBadge, { game: { status: 'SCHEDULED' }, showIcon: true })
      );
      assert.match(htmlUpcomingGame, /📅/);
    });

    it('shows detail text and bullet separator when showDetail is true', () => {
      const html = renderToString(
        React.createElement(GameStatusBadge, {
          game: { statusDetail: 'Q4 02:00', status: 'LIVE' },
          showDetail: true,
        })
      );
      assert.match(html, /&bull;|•/);
      assert.match(html, /Q4 02:00/);
    });

    it('appends custom className to root element', () => {
      const html = renderToString(
        React.createElement(GameStatusBadge, { className: 'custom-badge-style' })
      );
      assert.match(html, /custom-badge-style/);
    });

    it('sets correct title attribute', () => {
      const html = renderToString(
        React.createElement(GameStatusBadge, {
          game: { statusDetail: 'Final (2OT)', status: 'FINAL' },
        })
      );
      assert.match(html, /title="Status: Completed · Final \(2OT\)"/);
    });
  });

  describe('size variants', () => {
    it('applies xs size classes', () => {
      const html = renderToString(React.createElement(GameStatusBadge, { size: 'xs' }));
      assert.match(html, /text-\[9px\]/);
      assert.match(html, /w-1 h-1/);
    });

    it('applies sm size classes', () => {
      const html = renderToString(React.createElement(GameStatusBadge, { size: 'sm' }));
      assert.match(html, /text-\[10px\]/);
      assert.match(html, /w-1.5 h-1.5/);
    });

    it('applies md size classes', () => {
      const html = renderToString(React.createElement(GameStatusBadge, { size: 'md' }));
      assert.match(html, /text-xs/);
      assert.match(html, /w-2 h-2/);
    });

    it('applies lg size classes', () => {
      const html = renderToString(React.createElement(GameStatusBadge, { size: 'lg' }));
      assert.match(html, /text-sm/);
      assert.match(html, /w-2.5 h-2.5/);
    });
  });
});
