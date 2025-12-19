import type { Match, Ball } from '../types';



// PURE FUNCTION: Recalculate all stats for the ENTIRE MATCH
export const recalculateMatchStats = (match: Match): Match => {
    const newMatch = JSON.parse(JSON.stringify(match)) as Match;

    // 1. Reset ALL stats for EVERY player in both innings
    newMatch.innings.forEach(inning => {
        inning.players.forEach(p => {
            p.batting = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
            p.bowling = { overs: 0, balls: 0, runsConceded: 0, wickets: 0, maidens: 0 };
        });
        inning.totalRuns = 0;
        inning.totalWickets = 0;
        inning.ballsBowled = 0;
    });

    // 2. Process each inning
    newMatch.innings.forEach((inning, inningIndex) => {
        // Fielding Team Index (The OTHER inning's players)
        const fieldingInningIndex = inningIndex === 0 ? 1 : 0;
        // In some rare cases (like 1-inning match setup creation), the second inning might not be fully formed yet?
        // But in our structure, both innings exist from start.
        const fieldingInning = newMatch.innings[fieldingInningIndex];

        let inningRuns = 0;
        let inningWickets = 0;
        let inningLegalBalls = 0;

        inning.overs.forEach(over => {
            let overRuns = 0;
            let overWickets = 0;
            let validBallsInOver = 0;
            const bowlerId = over.bowlerId;

            over.balls.forEach(ball => {
                const runsOffBat = ball.runs;
                const extras = ball.extras || 0;
                const totalBallRuns = runsOffBat + extras;

                // Update Totals
                inningRuns += totalBallRuns;
                if (ball.isWicket) inningWickets++;
                if (ball.isValid) {
                    inningLegalBalls++;
                    validBallsInOver++;
                }

                // Batting Stats (In THIS inning)
                if (ball.strikerId) {
                    const striker = inning.players.find(p => p.id === ball.strikerId);
                    if (striker) {
                        if (ball.type !== 'WIDE') {
                            striker.batting.balls += 1;
                        }
                        striker.batting.runs += runsOffBat;
                        if (runsOffBat === 4) striker.batting.fours++;
                        if (runsOffBat === 6) striker.batting.sixes++;

                        if (ball.isWicket) {
                            striker.batting.isOut = true;
                            striker.batting.wicketBy = ball.bowlerId;
                        }
                    }
                }

                // Bowling Stats (In FIELDING inning)
                if (ball.bowlerId) {
                    const bowler = fieldingInning.players.find(p => p.id === ball.bowlerId);
                    if (bowler) {
                        if (ball.isValid) bowler.bowling.balls++;
                        bowler.bowling.runsConceded += totalBallRuns;
                        if (ball.isWicket) bowler.bowling.wickets++;
                    }
                }

                overRuns += totalBallRuns;
                if (ball.isWicket) overWickets++;
            });

            over.totalRuns = overRuns;
            over.wickets = overWickets;

            // Maiden Check
            if (bowlerId && validBallsInOver >= 6 && overRuns === 0) {
                const bowler = fieldingInning.players.find(p => p.id === bowlerId);
                if (bowler) bowler.bowling.maidens++;
            }
        });

        inning.totalRuns = inningRuns;
        inning.totalWickets = inningWickets;
        inning.ballsBowled = inningLegalBalls;
    });

    // 3. Format Overs (e.g. 1.2) for all players
    newMatch.innings.forEach(inning => {
        inning.players.forEach(p => {
            const totalBalls = p.bowling.balls;
            const completedOvers = Math.floor(totalBalls / 6);
            const remBalls = totalBalls % 6;
            p.bowling.overs = parseFloat(`${completedOvers}.${remBalls}`);
        });
    });

    return newMatch;
};

export const handleDelivery = (match: Match, ballInput: {
    type: Ball['type'],
    runs: number,
    isWicket: boolean,
    extras: number,
    isValid: boolean
}): Match => {
    const currentInningIndex = match.currentInningIndex;
    const inning = match.innings[currentInningIndex];

    if (!inning.strikerId || !inning.nonStrikerId || !inning.currentBowlerId) {
        console.error("Missing player state! Cannot record ball.");
        return match;
    }

    const newBall: Ball = {
        id: crypto.randomUUID(),
        type: ballInput.type,
        runs: ballInput.runs,
        extras: ballInput.extras,
        isWicket: ballInput.isWicket,
        isValid: ballInput.isValid,
        timestamp: Date.now(),
        strikerId: inning.strikerId,
        nonStrikerId: inning.nonStrikerId,
        bowlerId: inning.currentBowlerId
    };

    // Deep clone logic handled inside recalculateMatchStats, but we need to push ball first.
    // So we assume recalculateMatchStats will CLONE again? No, let's clone once here.
    const newMatch = JSON.parse(JSON.stringify(match)) as Match;
    const currentInning = newMatch.innings[currentInningIndex];
    let currentOver = currentInning.overs[currentInning.overs.length - 1];

    if (!currentOver) {
        currentOver = {
            number: currentInning.overs.length + 1,
            balls: [],
            isLocked: false,
            totalRuns: 0,
            wickets: 0,
            bowlerId: currentInning.currentBowlerId || undefined
        };
        currentInning.overs.push(currentOver);
    }
    if (!currentOver.bowlerId && currentInning.currentBowlerId) {
        currentOver.bowlerId = currentInning.currentBowlerId;
    }

    currentOver.balls.push(newBall);

    // Update Stats
    const statsUpdatedMatch = recalculateMatchStats(newMatch);
    // Note: statsUpdatedMatch is a DEEP CLONE of newMatch with stats updated.

    // Now handle Rotation Logic on the UPDATED match
    const finalInning = statsUpdatedMatch.innings[currentInningIndex];

    // Wicket Logic
    if (newBall.isWicket) {
        // ALWAYS set strikerId to null on wicket to trigger Manual Selection in UI
        finalInning.strikerId = null;
    } else {
        // Crossing Logic
        const runsRan = newBall.runs;
        if (runsRan % 2 !== 0) {
            const temp = finalInning.strikerId;
            finalInning.strikerId = finalInning.nonStrikerId;
            finalInning.nonStrikerId = temp;
        }
    }

    return statsUpdatedMatch;
};

// Start Next Over Logic
export const startNextOverEngine = (match: Match, nextBowlerId?: string): Match => {
    const newMatch = JSON.parse(JSON.stringify(match)) as Match;
    const inning = newMatch.innings[newMatch.currentInningIndex];
    const fieldingInningIndex = newMatch.currentInningIndex === 0 ? 1 : 0;
    const fieldingPlayers = newMatch.innings[fieldingInningIndex].players;

    // 1. Swap Striker/NonStriker (End of Over Rule)
    const temp = inning.strikerId;
    inning.strikerId = inning.nonStrikerId;
    inning.nonStrikerId = temp;

    // 2. Set new Bowler
    if (nextBowlerId) {
        inning.currentBowlerId = nextBowlerId;
    } else {
        // Auto-Rotate Logic: Swap Ends
        const lastOver = inning.overs[inning.overs.length - 1];
        const previousOver = inning.overs[inning.overs.length - 2];

        // If we have a previous over, try to use its bowler (A-B-A pattern)
        if (previousOver && previousOver.bowlerId) {
            // Check if he is allowed (max overs?) - Ignoring for now
            inning.currentBowlerId = previousOver.bowlerId;
        } else {
            // First Rotation (Over 1 -> Over 2)
            // Pick ANYONE who isn't the last bowler
            const lastBowlerId = lastOver?.bowlerId;

            // Try to find a bowler who hasn't bowled OR just the next one in list?
            // Simple robust: Find first player who != lastBowlerId
            const nextLink = fieldingPlayers.find(p => p.id !== lastBowlerId);
            if (nextLink) {
                inning.currentBowlerId = nextLink.id;
            }
            // Ideally we should prefer "Regular Bowlers" but we don't know them. 
            // Just picking the first available different player is standard gully default.
        }
    }

    // 3. Create Over Object
    inning.overs.push({
        number: inning.overs.length + 1,
        balls: [],
        isLocked: false,
        totalRuns: 0,
        wickets: 0,
        bowlerId: inning.currentBowlerId || undefined
    });

    return newMatch;
}
