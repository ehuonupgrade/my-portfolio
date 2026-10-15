import { GameMarket, LineMovementPoint } from '../types/sportsBetting';

export interface MaterialLineShiftAnalysis {
  hasMaterialMovement: boolean;
  openingPoint: LineMovementPoint;
  currentPoint: LineMovementPoint;
  spreadDelta: number; // Current - Opening
  totalDelta: number; // Current - Opening
  moneylineDelta: number; // Current - Opening
  crossedKeyNumbers: number[];
  isKeyNumberCrossed: boolean;
  isSteamMove: boolean;
  isReverseLineMovement: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE';
  materialityReasons: string[];
  primaryDriverNote: string;
}

/**
 * Key NFL spread thresholds where games land most frequently
 */
const KEY_SPREAD_NUMBERS = [3.0, -3.0, 7.0, -7.0, 6.0, -6.0, 10.0, -10.0, 4.0, -4.0, 14.0, -14.0];

/**
 * Analyzes a game's chronological line movements from offering to current state.
 * Identifies material shifts, key number crossings, steam moves, and RLM.
 */
export function analyzeGameLineMovement(game: GameMarket): MaterialLineShiftAnalysis {
  const movements = game.lineMovements || [];

  if (movements.length === 0) {
    const defaultPoint: LineMovementPoint = {
      timestamp: new Date().toISOString(),
      timeLabel: 'Current Consensus',
      spread: parseFloat(game.consensus?.spread) || 0,
      total: game.consensus?.total || 45.0,
      moneylineHome: game.consensus?.moneylineHome || -110,
      note: 'Initial offering',
    };

    return {
      hasMaterialMovement: false,
      openingPoint: defaultPoint,
      currentPoint: defaultPoint,
      spreadDelta: 0,
      totalDelta: 0,
      moneylineDelta: 0,
      crossedKeyNumbers: [],
      isKeyNumberCrossed: false,
      isSteamMove: false,
      isReverseLineMovement: false,
      severity: 'STABLE',
      materialityReasons: [],
      primaryDriverNote: 'Line offering has remained stable at opening numbers.',
    };
  }

  const openingPoint = movements[0];
  const currentPoint = movements[movements.length - 1];

  const spreadDelta = parseFloat((currentPoint.spread - openingPoint.spread).toFixed(1));
  const totalDelta = parseFloat((currentPoint.total - openingPoint.total).toFixed(1));
  const moneylineDelta = currentPoint.moneylineHome - openingPoint.moneylineHome;

  const materialityReasons: string[] = [];
  const crossedKeyNumbers: number[] = [];

  // 1. Check for Key Number Crossings
  const startSpread = openingPoint.spread;
  const endSpread = currentPoint.spread;
  const minSpread = Math.min(startSpread, endSpread);
  const maxSpread = Math.max(startSpread, endSpread);

  KEY_SPREAD_NUMBERS.forEach((keyNum) => {
    // Check if keyNum lies between start and end (exclusive or inclusive crossing)
    if (keyNum >= minSpread && keyNum <= maxSpread && startSpread !== endSpread) {
      crossedKeyNumbers.push(keyNum);
    }
  });

  const isKeyNumberCrossed = crossedKeyNumbers.length > 0;
  if (isKeyNumberCrossed) {
    const keysFormatted = crossedKeyNumbers
      .map((k) => (k > 0 ? `+${k}` : `${k}`))
      .join(', ');
    materialityReasons.push(
      `Crossed critical key margin threshold (${keysFormatted}): Spread shifted from ${
        startSpread > 0 ? `+${startSpread}` : startSpread
      } to ${endSpread > 0 ? `+${endSpread}` : endSpread}`
    );
  }

  // 2. Check Spread Delta Magnitude
  const absSpreadDelta = Math.abs(spreadDelta);
  if (absSpreadDelta >= 1.0 && !isKeyNumberCrossed) {
    materialityReasons.push(
      `Material spread shift of ${absSpreadDelta.toFixed(1)} points (${
        startSpread > 0 ? `+${startSpread}` : startSpread
      } → ${endSpread > 0 ? `+${endSpread}` : endSpread})`
    );
  }

  // 3. Check Total Delta Magnitude
  const absTotalDelta = Math.abs(totalDelta);
  if (absTotalDelta >= 1.5) {
    materialityReasons.push(
      `Material total line adjustment of ${absTotalDelta.toFixed(1)} points (${
        openingPoint.total
      } → ${currentPoint.total})`
    );
  }

  // 4. Check Moneyline Delta Magnitude
  const absMlDelta = Math.abs(moneylineDelta);
  if (absMlDelta >= 20) {
    materialityReasons.push(
      `Significant moneyline price movement of ${absMlDelta} cents (${
        openingPoint.moneylineHome > 0
          ? `+${openingPoint.moneylineHome}`
          : openingPoint.moneylineHome
      } → ${
        currentPoint.moneylineHome > 0
          ? `+${currentPoint.moneylineHome}`
          : currentPoint.moneylineHome
      })`
    );
  }

  // 5. Check for Reverse Line Movement (RLM) / Sharp Divergence
  let isReverseLineMovement = false;
  let isSteamMove = false;

  if (game.splits?.spread) {
    const homeTicketPct = game.splits.spread.home.ticketPercentage || 50;
    const homeMoneyPct = game.splits.spread.home.moneyPercentage || 50;

    // RLM: Public ticket majority on away (>55%), but spread moved towards home (spread became more negative/less positive)
    if (homeTicketPct < 45 && spreadDelta < 0) {
      isReverseLineMovement = true;
      materialityReasons.push(
        `Reverse Line Movement (RLM): Public backing away (${100 - homeTicketPct}% tickets), but line moved towards ${game.homeTeam.abbr}`
      );
    } else if (homeTicketPct > 55 && spreadDelta > 0) {
      isReverseLineMovement = true;
      materialityReasons.push(
        `Reverse Line Movement (RLM): Public backing ${game.homeTeam.abbr} (${homeTicketPct}% tickets), but line moved towards ${game.awayTeam.abbr}`
      );
    }

    // Steam move: Sharp money handle > 65% pushing line
    if (Math.abs(homeMoneyPct - homeTicketPct) >= 20) {
      isSteamMove = true;
      materialityReasons.push(
        `High Sharp Handle Steam: Money divergence of ${Math.abs(
          homeMoneyPct - homeTicketPct
        )}% between bets and dollar volume`
      );
    }
  }

  const hasMaterialMovement = materialityReasons.length > 0;

  // Determine Severity
  let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE' = 'STABLE';
  if (isKeyNumberCrossed || (isReverseLineMovement && absSpreadDelta >= 1.0)) {
    severity = 'CRITICAL';
  } else if (absSpreadDelta >= 1.0 || absTotalDelta >= 2.0 || isSteamMove) {
    severity = 'HIGH';
  } else if (hasMaterialMovement) {
    severity = 'MODERATE';
  }

  // Determine Primary Driver Note
  let primaryDriverNote =
    currentPoint.note || openingPoint.note || 'Market adjustment from syndicate limits.';
  if (movements.length > 1) {
    const middleNotes = movements
      .slice(1)
      .map((m) => m.note)
      .filter(Boolean);
    if (middleNotes.length > 0) {
      primaryDriverNote = middleNotes[middleNotes.length - 1]!;
    }
  }

  return {
    hasMaterialMovement,
    openingPoint,
    currentPoint,
    spreadDelta,
    totalDelta,
    moneylineDelta,
    crossedKeyNumbers,
    isKeyNumberCrossed,
    isSteamMove,
    isReverseLineMovement,
    severity,
    materialityReasons,
    primaryDriverNote,
  };
}
