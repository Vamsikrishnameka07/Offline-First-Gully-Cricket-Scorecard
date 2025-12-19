import type { Match, Ball, Inning } from '../types';

export const calculateInningStats = (inning: Inning): Inning => {
    let totalRuns = 0;
    let totalWickets = 0;
    let legalBalls = 0;

    inning.overs.forEach(over => {
        over.balls.forEach(ball => {
            totalRuns += ball.runs + (ball.extras || 0);
            if (ball.isWicket) totalWickets++;
            if (ball.isValid) legalBalls++;
        });
        // Update over stats as well
        over.totalRuns = over.balls.reduce((acc, b) => acc + b.runs + (b.extras || 0), 0);
        over.wickets = over.balls.filter(b => b.isWicket).length;
    });

    return {
        ...inning,
        totalRuns,
        totalWickets,
        ballsBowled: legalBalls
    };
};

export const addBallToMatch = (match: Match, ball: Ball): Match => {
    const currentInningIndex = match.currentInningIndex;
    const currentInning = match.innings[currentInningIndex];

    if (!currentInning) return match;

    // Clone to avoid mutation
    const newInning = JSON.parse(JSON.stringify(currentInning)) as Inning;

    // Find current over (last one)
    let currentOver = newInning.overs[newInning.overs.length - 1];

    // If no overs or current over is full AND locked? 
    // Actually, new over creation happens explicitly or auto?
    // User spec: "One-tap ball recording... Dispute lock after each over".
    // So we allow adding balls until over is full. Then it MUST proceed to next over (or lock).
    // Implementation: Check if current Over is valid to receive ball.

    const ballsInOver = currentOver ? currentOver.balls.filter(b => b.isValid).length : 0;

    if (!currentOver || (ballsInOver >= match.rules.ballsPerOver && currentOver.isLocked)) {
        // Should have started new over. BUT if we are here, maybe we need to create one?
        // Logic: If over is full, user must act to "Lock" or "Start new Over".
        // If user adds ball, it should probably be in valid state.
        // For now, assume currentOver exists and is open.
        // If ballsInOver >= match.rules.ballsPerOver, reject? 
        // We will handle "New Over" creation in store or UI.
    }

    // If over is finished but not locked, we technically shouldn't add balls if we want to force lock.
    // But for "undo", we might need flexibility.
    // Let's assume the UI enforces the Lock. Here we just add data.

    // Logic to handle "Next Over" if previous is full?
    // Better: Store handles "Start New Over". Here we just add to the *current active over*.
    if (currentOver) {
        currentOver.balls.push(ball);
    } else {
        // Should create first over if missing?
        newInning.overs.push({
            number: 1,
            balls: [ball],
            isLocked: false,
            totalRuns: 0,
            wickets: 0
        });
    }

    // Re-calculate stats
    const updatedInning = calculateInningStats(newInning);

    // Update match
    const newMatch = { ...match };
    newMatch.innings[currentInningIndex] = updatedInning;

    return newMatch;
};

export const createNewMatch = (
    teamA: string,
    teamB: string,
    oversCols: number,
    ballsPerOver: number,
    wideRuns: number = 1,
    noBallRuns: number = 1,
    playerNamesA?: string[],
    playerNamesB?: string[]
): Match => {
    const rules = { overs: oversCols, ballsPerOver, wideRuns, noBallRuns };

    // Function to generate default players
    const generatePlayers = (teamName: string, teamId: string, customNames?: string[]): import('../types').Player[] => {
        return Array.from({ length: 11 }, (_, i) => ({
            id: `${teamId}-p${i + 1}`,
            name: customNames?.[i] || `${teamName} Player ${i + 1}`,
            team: teamName,
            batting: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
            bowling: { overs: 0, balls: 0, runsConceded: 0, wickets: 0, maidens: 0 }
        }));
    };

    const playersA = generatePlayers(teamA, 'teamA', playerNamesA);
    const playersB = generatePlayers(teamB, 'teamB', playerNamesB);

    return {
        id: crypto.randomUUID(),
        teamA,
        teamB,
        status: "ONGOING",
        rules,
        currentInningIndex: 0,
        innings: [
            {
                battingTeam: teamA,
                bowlingTeam: teamB,
                players: playersA,
                strikerId: playersA[0].id,
                nonStrikerId: playersA[1].id,
                currentBowlerId: playersB[10].id, // Default bowler (last player)
                overs: [{ number: 1, balls: [], isLocked: false, totalRuns: 0, wickets: 0 }],
                totalRuns: 0,
                totalWickets: 0,
                ballsBowled: 0
            },
            {
                battingTeam: teamB,
                bowlingTeam: teamA,
                players: playersB,
                strikerId: playersB[0].id,
                nonStrikerId: playersB[1].id,
                currentBowlerId: playersA[10].id,
                overs: [], // Empty until 2nd inning starts
                totalRuns: 0,
                totalWickets: 0,
                ballsBowled: 0
            }
        ],
        createdAt: Date.now()
    };
};
