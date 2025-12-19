import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Share2, ShieldCheck } from 'lucide-react';
import ScoreButtons from '../components/ScoreButtons';
import OverSummary from '../components/OverSummary';
import ConfirmLockModal from '../components/ConfirmLockModal';
import type { BallType } from '../types';

export default function Scoreboard() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { currentMatch, loadMatch, addBall, undoLastBall, lockCurrentOver, startNextOver, isLoading } = useMatchStore();

    const [showLockModal, setShowLockModal] = useState(false);

    // Initial Load Effect
    useEffect(() => {
        if (matchId) {
            loadMatch(matchId);
        }
    }, [matchId, loadMatch]);

    // Auto-Redirect on Completion
    useEffect(() => {
        if (currentMatch?.status === "COMPLETED") {
            navigate(`/match/${matchId}/summary`);
        }
    }, [currentMatch?.status, matchId, navigate]);

    // Derived State
    const currentInning = currentMatch ? currentMatch.innings[currentMatch.currentInningIndex] : undefined;
    const currentOver = currentInning ? currentInning.overs[currentInning.overs.length - 1] : undefined;

    // Stats
    const totalRuns = currentInning ? currentInning.totalRuns : 0;
    const totalWickets = currentInning ? currentInning.totalWickets : 0;
    const oversBowled = currentInning ? currentInning.overs.length - 1 : 0;
    const ballsInCurrentOver = currentOver ? currentOver.balls.filter(b => b.isValid).length : 0;
    const displayOvers = `${oversBowled}.${ballsInCurrentOver}`;

    // Derived Players
    const striker = currentInning && currentInning.strikerId
        ? currentInning.players.find(p => p.id === currentInning.strikerId) : null;
    const nonStriker = currentInning && currentInning.nonStrikerId
        ? currentInning.players.find(p => p.id === currentInning.nonStrikerId) : null;

    // Bowler comes from the Fielding Team (which is the OTHER inning's players)
    // Team A batting = Index 0. Fielding Team = Index 1.
    const fieldingInningIndex = currentMatch ? (currentMatch.currentInningIndex === 0 ? 1 : 0) : -1;
    const bowler = (currentMatch && currentInning && currentInning.currentBowlerId && fieldingInningIndex !== -1)
        ? currentMatch.innings[fieldingInningIndex].players.find(p => p.id === currentInning.currentBowlerId)
        : null;

    const isOverComplete = currentMatch ? ballsInCurrentOver >= currentMatch.rules.ballsPerOver : false;

    // Auto-show lock modal
    useEffect(() => {
        if (currentMatch && currentOver && !currentOver.isLocked && ballsInCurrentOver >= currentMatch.rules.ballsPerOver) {
            setShowLockModal(true);
        }
    }, [ballsInCurrentOver, currentMatch, currentOver]);

    if (isLoading || !currentMatch || !currentInning || !currentOver) {
        return <div className="h-screen flex items-center justify-center text-white bg-black">Loading Scorecard...</div>;
    }

    const handleScore = async (type: BallType, runs: number, isWicket: boolean) => {
        if (isOverComplete || currentOver.isLocked) return;

        await addBall({
            id: crypto.randomUUID(),
            type,
            runs,
            isWicket,
            isValid: true,
            timestamp: Date.now(),
            extras: 0
        });
    };

    const handleLockConfirm = async () => {
        await lockCurrentOver();
        setShowLockModal(false);

        // Logic for match end vs next inning
        if (currentInning.ballsBowled >= (currentMatch.rules.overs * currentMatch.rules.ballsPerOver) ||
            (currentInning.overs.length >= currentMatch.rules.overs && isOverComplete)) {

            // Note: In store startNextOver handles exact logic of switching innings.
            // We just call it. But if match ends, we navigate.
            // We can check match status *after* update, or pre-calculate.

            // Simplest: Call startNextOver. Then check status.
            await startNextOver();
            // Since state updates are async in React but we await store...
            // We rely on "isMatchComplete" derived from store in next render?
            // Or check if we are at end.

            if (currentMatch.currentInningIndex === 1 && currentInning.overs.length >= currentMatch.rules.overs) {
                navigate(`/match/${matchId}/summary`);
            }
        } else {
            await startNextOver();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white relative font-sans">
            {/* Header */}
            <div className="p-3 flex justify-between items-center bg-neutral-900 border-b border-neutral-800">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
                        {currentMatch.innings[0].battingTeam} vs {currentMatch.innings[1].battingTeam}
                    </span>
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                        <ShieldCheck size={10} /> {currentInning.battingTeam} Batting
                    </span>
                </div>
                <button className="p-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-full">
                    <Share2 size={16} />
                </button>
            </div>

            {/* Main Score & Stats */}
            <div className="flex-1 overflow-y-auto pb-4">
                {/* Score Big Display */}
                <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-neutral-900 to-black">
                    <div className="text-7xl font-black text-white leading-none tracking-tighter">
                        {totalRuns}/{totalWickets}
                    </div>
                    <div className="text-xl text-neutral-400 font-mono mt-2">
                        Overs: <span className="text-white font-bold">{displayOvers}</span>
                        <span className="text-neutral-600 mx-1">/</span>
                        {currentMatch.rules.overs}
                    </div>

                    {/* Target Logic (If 2nd Inning) */}
                    {currentMatch.currentInningIndex === 1 && (
                        <div className="mt-2 px-3 py-1 bg-neutral-800 rounded-full text-xs font-bold text-blue-400">
                            Target: {currentMatch.innings[0].totalRuns + 1}
                        </div>
                    )}
                </div>

                {/* Batting Card */}
                <div className="px-4 mb-4">
                    <div className="bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800">
                        <div className="bg-neutral-800/50 px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex justify-between">
                            <span>Batsman</span>
                            <span>R (B)</span>
                        </div>
                        {striker && (
                            <div className="px-3 py-3 flex justify-between items-center border-b border-neutral-800/50">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="font-bold text-white text-lg">{striker.name} ∗</span>
                                </div>
                                <div className="font-mono text-xl font-bold text-green-400">
                                    {striker.batting.runs} <span className="text-sm text-neutral-500">({striker.batting.balls})</span>
                                </div>
                            </div>
                        )}
                        {nonStriker && (
                            <div className="px-3 py-3 flex justify-between items-center">
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="text-neutral-400 text-sm">{nonStriker.name}</span>
                                </div>
                                <div className="font-mono text-base text-neutral-400">
                                    {nonStriker.batting.runs} <span className="text-xs text-neutral-600">({nonStriker.batting.balls})</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bowling Card */}
                <div className="px-4 mb-4">
                    <div className="bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-800">
                        <div className="bg-neutral-800/50 px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex justify-between">
                            <span>Bowler</span>
                            <span>Figures</span>
                        </div>
                        {bowler ? (
                            <div className="px-3 py-3 flex justify-between items-center">
                                <span className="font-semibold text-neutral-200">{bowler.name}</span>
                                <div className="font-mono text-sm text-neutral-300">
                                    {bowler.bowling.overs} - {bowler.bowling.maidens} - {bowler.bowling.runsConceded} - <span className="font-bold text-white">{bowler.bowling.wickets}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 text-center text-xs text-neutral-600">No Bowler Selected</div>
                        )}
                    </div>
                </div>

                {/* Over Summary */}
                <div className="px-4">
                    <div className="text-[10px] text-neutral-500 mb-2 uppercase tracking-wider font-bold">Current Over</div>
                    {currentOver && <OverSummary balls={currentOver.balls} />}
                </div>
            </div>

            {/* Controls */}
            <ScoreButtons
                onScore={handleScore}
                onUndo={undoLastBall}
                disabled={isOverComplete && !currentOver.isLocked}
            />

            {/* Modal */}
            {showLockModal && (
                <ConfirmLockModal
                    onConfirm={handleLockConfirm}
                    teamA={currentMatch.teamA}
                    teamB={currentMatch.teamB}
                />
            )}
        </div>
    );
}
