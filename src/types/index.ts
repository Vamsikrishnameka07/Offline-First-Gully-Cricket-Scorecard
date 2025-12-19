export type BallType = 'DOT' | 'RUN' | 'FOUR' | 'SIX' | 'WIDE' | 'NOBALL' | 'BYE' | 'LEGBYE' | 'WICKET';

export interface Ball {
    id: string;
    type: BallType;
    runs: number; // Runs off the bat (or extras if wide/nb not separate)
    extras: number; // Wide/NB/Bye runs
    isWicket: boolean;
    isValid: boolean; // Counts towards over?
    timestamp: number;

    // Advanced: Link to specific player events
    strikerId?: string;
    nonStrikerId?: string;
    bowlerId?: string;
    wicketType?: string; // bowled, caught, etc. (Optional for MVP)
}

export interface Over {
    number: number;
    balls: Ball[];
    isLocked: boolean;

    // Stats for this over
    totalRuns: number;
    wickets: number;
    bowlerId?: string; // Who bowled this over
}

export interface BattingStats {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    wicketBy?: string; // Bowler name who took the wicket
}

export interface BowlingStats {
    overs: number; // Completed overs
    balls: number; // Balls in current over
    runsConceded: number;
    wickets: number;
    maidens: number;
}

export interface Player {
    id: string;
    name: string;
    team: string; // 'A' or 'B' (or actual name)
    batting: BattingStats;
    bowling: BowlingStats;
}

export interface Inning {
    battingTeam: string;
    bowlingTeam: string;

    // Roster and State
    players: Player[];
    strikerId: string | null;     // ID of current striker
    nonStrikerId: string | null;  // ID of current non-striker
    currentBowlerId: string | null; // ID of current bowler

    // Match Flow
    overs: Over[];
    totalRuns: number;
    totalWickets: number;
    ballsBowled: number;
}

export interface MatchRules {
    overs: number;
    ballsPerOver: number;
    wideRuns: number;
    noBallRuns: number;
}

export interface Match {
    id: string;
    teamA: string; // Name of Team A
    teamB: string; // Name of Team B

    status: 'ONGOING' | 'COMPLETED' | 'DRAWN';
    winner?: string;
    winMargin?: string;

    rules: MatchRules;

    currentInningIndex: number; // 0 or 1
    innings: [Inning, Inning]; // Exactly two innings

    createdAt: number;
}
