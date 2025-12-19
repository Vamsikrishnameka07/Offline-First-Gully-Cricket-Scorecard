export type BallType = "DOT" | "RUN" | "FOUR" | "SIX" | "WICKET" | "WIDE" | "NO_BALL";

export interface Rules {
    overs: number;
    ballsPerOver: number;
    wideRuns: number;
    noBallRuns: number;
}

export interface Ball {
    id: string;
    type: BallType;
    runs: number;
    isWicket: boolean;
    isValid: boolean; // False for wide/no-ball if they don't count as a legal delivery
    timestamp: number;
    extras: number; // Runs from wide/no-ball
}

export interface Over {
    number: number;
    balls: Ball[];
    isLocked: boolean;
    totalRuns: number;
    wickets: number;
}

export interface Inning {
    battingTeam: string;
    bowlingTeam: string;
    overs: Over[];
    totalRuns: number;
    totalWickets: number;
    ballsBowled: number; // Legal deliveries
}

export interface Match {
    id: string;
    teamA: string;
    teamB: string;
    status: "SETUP" | "ONGOING" | "COMPLETED";
    rules: Rules;
    innings: Inning[]; // [0] = first inning, [1] = second inning
    currentInningIndex: number;
    createdAt: number;
    winner?: string;
    winMargin?: string;
}
