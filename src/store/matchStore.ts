import { create } from 'zustand';
import type { Match, Ball } from '../types';
import { saveMatch, getMatch } from '../db';
import { createNewMatch } from '../utils/scoringLogic';
import { handleDelivery, startNextOverEngine, recalculateMatchStats } from '../utils/scoringEngine';



interface MatchState {
    currentMatch: Match | null;
    isLoading: boolean;
    loadMatch: (id: string) => Promise<void>;
    startNewMatch: (data: {
        teamA: string;
        teamB: string;
        overs: number;
        ballsPerOver: number;
        playersA?: string[];
        playersB?: string[];
    }) => Promise<string>;
    addBall: (ball: Ball) => Promise<void>;
    undoLastBall: () => Promise<void>;
    lockCurrentOver: () => Promise<void>;
    startNextOver: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
    currentMatch: null,
    isLoading: false,

    loadMatch: async (id: string) => {
        set({ isLoading: true });
        const match = await getMatch(id);
        set({ currentMatch: match || null, isLoading: false });
    },

    startNewMatch: async ({ teamA, teamB, overs, ballsPerOver, playersA, playersB }) => {
        const match = createNewMatch(teamA, teamB, overs, ballsPerOver, 1, 1, playersA, playersB);
        await saveMatch(match);
        set({ currentMatch: match });
        return match.id;
    },

    addBall: async (ball: Ball) => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        // Adapt UI Ball object to Engine Input
        const newMatch = handleDelivery(currentMatch, {
            type: ball.type,
            runs: ball.runs,
            isWicket: ball.isWicket,
            extras: ball.extras,
            isValid: ball.isValid
        });

        // CHECK MATCH END CONDITION (Winning Run)
        if (newMatch.currentInningIndex === 1) {
            const target = newMatch.innings[0].totalRuns + 1;
            const currentRuns = newMatch.innings[1].totalRuns;

            if (currentRuns >= target) {
                newMatch.status = "COMPLETED";
                newMatch.winner = newMatch.teamB;
                newMatch.winMargin = `${10 - newMatch.innings[1].totalWickets} Wickets`
            }
            // Note: "All out" end condition is handled where? 
            // Currently "All out" signals `strikerId = null`. 
            // If strikerId is null, we should probably auto-end innings?
            // But for now, let's just stick to "Winning Run".
        }

        await saveMatch(newMatch);
        set({ currentMatch: newMatch });
    },

    undoLastBall: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        // Deep clone
        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];
        const currentOver = inning.overs[inning.overs.length - 1];

        if (currentOver && currentOver.balls.length > 0) {
            if (currentOver.isLocked) return;

            // 1. Pop Last Ball
            const poppedBall = currentOver.balls.pop();

            // 2. Restore State Context (Event Sourcing Reverse)
            if (poppedBall) {
                if (poppedBall.strikerId) inning.strikerId = poppedBall.strikerId;
                if (poppedBall.nonStrikerId) inning.nonStrikerId = poppedBall.nonStrikerId;
                if (poppedBall.bowlerId) inning.currentBowlerId = poppedBall.bowlerId;
            }

            // 3. Recalculate Stats for the whole MATCH
            const recalculatedMatch = recalculateMatchStats(newMatch);

            await saveMatch(recalculatedMatch);
            set({ currentMatch: recalculatedMatch });
        }
    },

    lockCurrentOver: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];
        const currentOver = inning.overs[inning.overs.length - 1];

        if (currentOver) {
            currentOver.isLocked = true;
            await saveMatch(newMatch);
            set({ currentMatch: newMatch });
        }
    },

    startNextOver: async () => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];

        // Check if max overs reached?
        if (inning.overs.length >= newMatch.rules.overs) {
            // Inning 1 Ends -> Start Inning 2
            if (newMatch.currentInningIndex === 0) {
                newMatch.currentInningIndex = 1;
                const secondInning = newMatch.innings[1];
                if (secondInning.overs.length === 0) {
                    secondInning.overs.push({
                        number: 1,
                        balls: [],
                        isLocked: false,
                        totalRuns: 0,
                        wickets: 0
                    });
                }
                await saveMatch(newMatch);
                set({ currentMatch: newMatch });
                return;
            }
            // Inning 2 Ends -> Match Complete
            else {
                newMatch.status = "COMPLETED";
                // Simple result calculation
                const runsA = newMatch.innings[0].totalRuns;
                const runsB = newMatch.innings[1].totalRuns;
                if (runsA > runsB) {
                    newMatch.winner = newMatch.teamA;
                    newMatch.winMargin = `${runsA - runsB} Runs`;
                } else if (runsB > runsA) {
                    newMatch.winner = newMatch.teamB;
                    newMatch.winMargin = `${10 - newMatch.innings[1].totalWickets} Wickets`;
                } else {
                    newMatch.winner = "Draw";
                    newMatch.winMargin = "Tie";
                }

                await saveMatch(newMatch);
                set({ currentMatch: newMatch });
                return;
            }
        }

        // Use Engine for next over creation (handles rotation logic)
        const updatedMatch = startNextOverEngine(newMatch);
        await saveMatch(updatedMatch);
        set({ currentMatch: updatedMatch });
    }

}));
