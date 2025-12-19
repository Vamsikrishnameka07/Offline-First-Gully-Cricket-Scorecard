
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
            console.log("Loading match:", matchId);
            loadMatch(matchId);
        }
    }, [matchId, loadMatch]);

    // Derived State (Safe access even if currentMatch is null)
    const currentInning = currentMatch ? currentMatch.innings[currentMatch.currentInningIndex] : undefined;
    const currentOver = currentInning ? currentInning.overs[currentInning.overs.length - 1] : undefined;

    // Stats Calculation
    const oversBowled = currentInning ? currentInning.overs.length - 1 : 0;
    const ballsInCurrentOver = currentOver ? currentOver.balls.filter(b => b.isValid).length : 0;
    const displayOvers = `${oversBowled}.${ballsInCurrentOver}`;

    const isOverComplete = currentMatch ? ballsInCurrentOver >= currentMatch.rules.ballsPerOver : false;

    // Auto-show lock modal if over just completed
    // THIS EFFECT MUST BE HERE (Before any early return)
    useEffect(() => {
        if (currentMatch && currentOver && !currentOver.isLocked && ballsInCurrentOver >= currentMatch.rules.ballsPerOver) {
            setShowLockModal(true);
        }
    }, [ballsInCurrentOver, currentMatch, currentOver]);

    // NOW we can handle loading state or missing match
    if (isLoading || !currentMatch || !currentInning || !currentOver) {
        return <div className="h-screen flex items-center justify-center text-white">Loading Scorecard...</div>;
    }

    const handleScore = async (type: BallType, runs: number, isWicket: boolean) => {
        if (isOverComplete || currentOver.isLocked) return;

        await addBall({
            id: crypto.randomUUID(),
            type,
            runs,
            isWicket,
            isValid: true, // Assuming all buttons are valid balls for MVP
            timestamp: Date.now(),
            extras: 0
        });
    };

    const handleLockConfirm = async () => {
        await lockCurrentOver();
        setShowLockModal(false);

        await lockCurrentOver();
        setShowLockModal(false);

        // Check if *current* inning is done
        if (currentInning.overs.length >= currentMatch.rules.overs) {
            // Logic for match end vs next inning
            if (currentMatch.currentInningIndex === 0) {
                // First Inning Done -> Trigger Next Inning
                await startNextOver();
                // Store will handle index increment. 
                // UI will re-render with new inning data.
            } else {
                // Second Inning Done -> Match End
                // Ensure the store processes the match completion first
                await startNextOver(); // This calculates winner etc. inside store
                navigate(`/match/${matchId}/summary`);
            }
        } else {
            // Just next over
            await startNextOver();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white relative">
            {/* Header */}
            <div className="p-4 flex justify-between items-start bg-neutral-900 border-b border-neutral-800">
                <div>
                    <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{currentMatch.teamA} vs {currentMatch.teamB}</h2>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-green-500 text-xs flex items-center gap-1"><ShieldCheck size={12} /> Verified Match</span>
                    </div>
                </div>
                <button className="text-neutral-400 hover:text-white p-2">
                    <Share2 size={20} />
                </button>
            </div>

            {/* Main Score Display */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-8xl font-black tabular-nums tracking-tighter leading-none text-white">
                        {currentInning.totalRuns}<span className="text-4xl text-neutral-500">/{currentInning.totalWickets}</span>
                    </div>
                    <div className="text-2xl font-mono text-neutral-400">
                        Overs: <span className="text-white">{displayOvers}</span>
                        <span className="text-neutral-600 mx-2">/</span>
                        {currentMatch.rules.overs}
                    </div>
                </div>

                <div className="w-full text-center">
                    {currentInning.battingTeam} Batting
                </div>
            </div>

            {/* Over Summary */}
            <div className="px-4">
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold">This Over</div>
                {currentOver && <OverSummary balls={currentOver.balls} />}
            </div>

            {/* Scoring Controls */}
            <ScoreButtons
                onScore={handleScore}
                onUndo={undoLastBall}
                disabled={isOverComplete && !currentOver.isLocked} // Disable input while waiting for lock
            />

            {/* Modals */}
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
