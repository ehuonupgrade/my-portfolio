import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameStatusBadge, getGameDisplayStatus } from './GameStatusBadge.js';

test('getGameDisplayStatus - null or undefined game input', () => {
  const resultUndefined = getGameDisplayStatus(undefined);
  assert.equal(resultUndefined.status, 'UPCOMING');
  assert.equal(resultUndefined.label, 'Upcoming');
  assert.equal(resultUndefined.shortLabel, 'UPCOMING');
  assert.equal(resultUndefined.isUpcoming, true);
  assert.equal(resultUndefined.isLive, false);
  assert.equal(resultUndefined.isCompleted, false);
  assert.equal(resultUndefined.icon, '⏳');
  assert.equal(resultUndefined.detail, 'Scheduled');

  const resultNull = getGameDisplayStatus(null);
  assert.equal(resultNull.status, 'UPCOMING');
  assert.equal(resultNull.isUpcoming, true);
});

test('getGameDisplayStatus - COMPLETED status resolution triggers', () => {
  const completedStatuses = [
    { status: 'FINAL' },
    { status: 'COMPLETED' },
    { gameStatusCategory: 'completed' },
    { statusState: 'post' },
    { scheduledTime: 'Game Final' },
    { statusDetail: 'Final (OT)' },
    { scheduledTime: 'Settled bet' },
    { statusDetail: 'Settled in regulation' },
  ];

  for (const gameData of completedStatuses) {
    const res = getGameDisplayStatus(gameData);
    assert.equal(res.status, 'COMPLETED', `Failed for input: ${JSON.stringify(gameData)}`);
    assert.equal(res.label, 'Completed');
    assert.equal(res.isCompleted, true);
    assert.equal(res.isLive, false);
    assert.equal(res.isUpcoming, false);
    assert.equal(res.icon, '✓');
  }
});

test('getGameDisplayStatus - COMPLETED score summary and detail resolution', () => {
  const completedWithScores = getGameDisplayStatus({
    status: 'FINAL',
    scores: { home: 27, away: 20 },
    homeTeam: { abbr: 'PHI' },
    awayTeam: { abbr: 'NYG' },
    statusDetail: 'Final/OT',
  });
  assert.equal(completedWithScores.scoreSummary, 'PHI 27 - 20 NYG');
  assert.equal(completedWithScores.detail, 'Final/OT');

  const completedWithDefaultAbbrs = getGameDisplayStatus({
    status: 'FINAL',
    scores: { home: 14, away: 10 },
  });
  assert.equal(completedWithDefaultAbbrs.scoreSummary, 'HOM 14 - 10 AWY');

  const completedWithoutScores = getGameDisplayStatus({
    status: 'FINAL',
    scheduledTime: '7:00 PM',
  });
  assert.equal(completedWithoutScores.scoreSummary, undefined);
  assert.equal(completedWithoutScores.detail, '7:00 PM');
});

test('getGameDisplayStatus - IN_PROGRESS status resolution triggers', () => {
  const inProgressStatuses = [
    { status: 'LIVE' },
    { status: 'IN_PROGRESS' },
    { gameStatusCategory: 'in progress' },
    { statusState: 'in' },
    { scheduledTime: 'Live Streaming' },
    { statusDetail: 'q1 12:45' },
    { statusDetail: 'q2 05:10' },
    { statusDetail: 'q3 11:20' },
    { statusDetail: 'q4 02:00' },
    { statusDetail: 'halftime' },
    { statusDetail: 'ot 04:30' },
    { scores: { home: 7, away: 3 } },
  ];

  for (const gameData of inProgressStatuses) {
    const res = getGameDisplayStatus(gameData);
    assert.equal(res.status, 'IN_PROGRESS', `Failed for input: ${JSON.stringify(gameData)}`);
    assert.equal(res.label, 'In Progress');
    assert.equal(res.isLive, true);
    assert.equal(res.isCompleted, false);
    assert.equal(res.isUpcoming, false);
    assert.equal(res.icon, '⚡');
  }
});

test('getGameDisplayStatus - IN_PROGRESS score summary and detail resolution', () => {
  const liveWithScores = getGameDisplayStatus({
    status: 'LIVE',
    scores: { home: 21, away: 17 },
    homeTeam: { abbr: 'DET' },
    awayTeam: { abbr: 'GB' },
    statusDetail: '3rd Quarter',
  });
  assert.equal(liveWithScores.scoreSummary, 'GB 17 @ DET 21');
  assert.equal(liveWithScores.detail, '3rd Quarter');

  const liveWithDefaultAbbrs = getGameDisplayStatus({
    status: 'LIVE',
    scores: { home: 7, away: 0 },
  });
  assert.equal(liveWithDefaultAbbrs.scoreSummary, 'AWY 0 @ HOM 7');

  const liveWithoutDetail = getGameDisplayStatus({
    status: 'LIVE',
  });
  assert.equal(liveWithoutDetail.detail, 'Live In-Play');
});

test('getGameDisplayStatus - UPCOMING status fallback', () => {
  const upcomingGame = getGameDisplayStatus({
    status: 'SCHEDULED',
    scheduledTime: 'Tomorrow 8:15 PM',
  });
  assert.equal(upcomingGame.status, 'UPCOMING');
  assert.equal(upcomingGame.label, 'Upcoming');
  assert.equal(upcomingGame.isUpcoming, true);
  assert.equal(upcomingGame.icon, '📅');
  assert.equal(upcomingGame.detail, 'Tomorrow 8:15 PM');

  const upcomingDefaultDetail = getGameDisplayStatus({ status: 'SCHEDULED' });
  assert.equal(upcomingDefaultDetail.detail, 'Upcoming Kickoff');
});

test('GameStatusBadge - basic component rendering', () => {
  const html = renderToStaticMarkup(React.createElement(GameStatusBadge, {}));
  assert.ok(html.includes('Upcoming'));
  assert.ok(html.includes('title="Status: Upcoming · Scheduled"'));
});

test('GameStatusBadge - statusOverride prop', () => {
  // Override to IN_PROGRESS
  const htmlInProgress = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'IN_PROGRESS' })
  );
  assert.ok(htmlInProgress.includes('In Progress'));
  assert.ok(htmlInProgress.includes('bg-emerald-950'));

  const htmlLive = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'LIVE' as any })
  );
  assert.ok(htmlLive.includes('In Progress'));

  // Override to COMPLETED
  const htmlCompleted = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'COMPLETED' })
  );
  assert.ok(htmlCompleted.includes('Completed'));
  assert.ok(htmlCompleted.includes('bg-slate-950'));

  const htmlFinal = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'FINAL' as any })
  );
  assert.ok(htmlFinal.includes('Completed'));

  // Override to UPCOMING
  const htmlUpcoming = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'UPCOMING' })
  );
  assert.ok(htmlUpcoming.includes('Upcoming'));
  assert.ok(htmlUpcoming.includes('bg-cyan-950'));

  const htmlScheduled = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { statusOverride: 'SCHEDULED' as any })
  );
  assert.ok(htmlScheduled.includes('Upcoming'));
});

test('GameStatusBadge - showDot, showIcon, showDetail props', () => {
  // Default showDot=true, showIcon=false, showDetail=false
  const defaultHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, {
      game: { status: 'LIVE', statusDetail: 'Q4 2:00' },
    })
  );
  assert.ok(defaultHtml.includes('rounded-full')); // dot present
  assert.ok(!defaultHtml.includes('⚡')); // icon not shown
  assert.ok(!defaultHtml.includes('truncate max-w-[150px]')); // detail span not shown

  // showDot=false, showIcon=true, showDetail=true
  const fullHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, {
      game: { status: 'LIVE', statusDetail: 'Q4 2:00' },
      showDot: false,
      showIcon: true,
      showDetail: true,
    })
  );
  assert.ok(!fullHtml.includes('rounded-full')); // dot absent
  assert.ok(fullHtml.includes('⚡')); // icon shown
  assert.ok(fullHtml.includes('truncate max-w-[150px]')); // detail span shown
  assert.ok(fullHtml.includes('Q4 2:00')); // detail content shown
  assert.ok(fullHtml.includes('•') || fullHtml.includes('&bull;')); // bullet separator shown
});

test('GameStatusBadge - size variations', () => {
  const xsHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { size: 'xs' })
  );
  assert.ok(xsHtml.includes('text-[9px]'));
  assert.ok(xsHtml.includes('w-1 h-1'));

  const smHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { size: 'sm' })
  );
  assert.ok(smHtml.includes('text-[10px]'));
  assert.ok(smHtml.includes('w-1.5 h-1.5'));

  const mdHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { size: 'md' })
  );
  assert.ok(mdHtml.includes('text-xs'));
  assert.ok(mdHtml.includes('w-2 h-2'));

  const lgHtml = renderToStaticMarkup(
    React.createElement(GameStatusBadge, { size: 'lg' })
  );
  assert.ok(lgHtml.includes('text-sm'));
  assert.ok(lgHtml.includes('w-2.5 h-2.5'));
});

test('GameStatusBadge - custom className and title attribute', () => {
  const html = renderToStaticMarkup(
    React.createElement(GameStatusBadge, {
      game: { status: 'FINAL', statusDetail: 'Final/OT' },
      className: 'custom-class-123',
    })
  );
  assert.ok(html.includes('custom-class-123'));
  assert.ok(html.includes('title="Status: Completed · Final/OT"'));
});
