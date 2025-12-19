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
    setStrikerId: (playerId: string) => Promise<void>;
    startNextOver: (bowlerId?: string) => Promise<void>;
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

    setStrikerId: async (playerId: string) => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        newMatch.innings[newMatch.currentInningIndex].strikerId = playerId;

        await saveMatch(newMatch);
        set({ currentMatch: newMatch });
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

    startNextOver: async (bowlerId?: string) => {
        const { currentMatch } = get();
        if (!currentMatch) return;

        const newMatch = JSON.parse(JSON.stringify(currentMatch)) as Match;
        const inning = newMatch.innings[newMatch.currentInningIndex];

        // Check Inning Completion (Max Overs or All Out)
        // Standard cricket: All out is usually when wickets = players - 1 (since 2 batsmen needed)
        // But for gully cricket, sometimes last man standing counts? Assuming standard - 1 for now or 10.
        // Let's use a safe fallback: if provided players > 0, use len-1, else 10.
        const maxWickets = inning.players.length > 0 ? (inning.players.length - 1) : 10;
        const isAllOut = inning.totalWickets >= maxWickets;
        const isOversComplete = inning.overs.length >= newMatch.rules.overs;

        if (isOversComplete || isAllOut) {
            // Inning 1 Ends -> Start Inning 2
            if (newMatch.currentInningIndex === 0) {
                newMatch.currentInningIndex = 1;
                const secondInning = newMatch.innings[1];

                // Ensure Inning 2 is ready
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
                    newMatch.winMargin = `${maxWickets - newMatch.innings[1].totalWickets} Wickets`; // Approx logic
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
        const updatedMatch = startNextOverEngine(newMatch, bowlerId);
        await saveMatch(updatedMatch);
        set({ currentMatch: updatedMatch });
    }

}));
