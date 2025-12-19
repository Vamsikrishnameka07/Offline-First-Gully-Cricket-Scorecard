import React, { useState, useEffect } from 'react';
import { useMatchStore } from '../store/matchStore';
import { ArrowLeft, MoreVertical, RotateCcw, Share2, AlertCircle } from 'lucide-react'; // Changed Lock to Share2 to match image icon roughly (or standard menu)
import { useNavigate, useParams } from 'react-router-dom';
import ScoreButtons from '../components/ScoreButtons';
import OverSummary from '../components/OverSummary';
import { PlayerSelectModal } from '../components/PlayerSelectModal';

export default function Scoreboard() {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const {
        currentMatch,
        loadMatch,
        isLoading,
        addBall,
        undoLastBall,
        lockCurrentOver,
        startNextOver,
        setStrikerId
    } = useMatchStore();

    // Initial Load
    useEffect(() => {
        if (matchId && (!currentMatch || currentMatch.id !== matchId)) {
            loadMatch(matchId);
        }
    }, [matchId, loadMatch, currentMatch?.id]);

    // Redirect on Completion
    useEffect(() => {
        if (currentMatch?.status === "COMPLETED") {
            const timer = setTimeout(() => {
                navigate(`/match/${matchId}/summary`, { replace: true });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentMatch?.status, navigate, matchId]);

    const [showMenu, setShowMenu] = useState(false);
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [showBowlerSelect, setShowBowlerSelect] = useState(false);
    const [autoLockTriggered, setAutoLockTriggered] = useState(false);

    // Derived State
    const currentInning = currentMatch?.innings[currentMatch.currentInningIndex];
    const currentOver = currentInning?.overs[currentInning.overs.length - 1];

    // Players for Display
    const striker = currentInning?.players.find(p => p.id === currentInning.strikerId);
    const nonStriker = currentInning?.players.find(p => p.id === currentInning.nonStrikerId);
    const bowler = currentMatch && currentInning ?
        currentMatch.innings[currentMatch.currentInningIndex === 0 ? 1 : 0]
            .players.find(p => p.id === currentInning.currentBowlerId)
        : undefined;

    // --- Batsman Selection Logic (Wicket Fall) ---
    const eligibleBatsmen = currentInning?.players.filter(p =>
        !p.batting.isOut &&
        p.id !== currentInning.nonStrikerId &&
        p.id !== currentInning.strikerId
    ) || [];

    const isStrikerSelectionNeeded = currentInning && !currentInning.strikerId && eligibleBatsmen.length > 0 && currentMatch?.status !== "COMPLETED";

    const handleStrikerSelect = (playerId: string) => {
        setStrikerId(playerId);
    };

    // --- Bowler Selection Logic (Over End) ---
    const handleLockConfirm = async () => {
        await lockCurrentOver();
        setIsLockModalOpen(false);
        setAutoLockTriggered(false);
        setShowBowlerSelect(true);
    };

    const handleBowlerSelect = async (playerId: string) => {
        await startNextOver(playerId);
        setShowBowlerSelect(false);
    };

    const isOverComplete = currentMatch ? (currentOver?.balls.filter(b => b.isValid).length || 0) >= currentMatch.rules.ballsPerOver : false;

    // Inning Completion Logic
    const maxWickets = currentInning?.players.length ? (currentInning.players.length - 1) : 10;
    const isAllOut = (currentInning?.totalWickets || 0) >= maxWickets;
    // Note: Overs completion requires the actual Over to be completed (balls bowled) 
    // AND check against total overs. We use isOverComplete to know if current is done.
    // If we are at last over, and it is complete/locked... 
    const isLastOver = currentMatch && currentInning ? currentInning.overs.length >= currentMatch.rules.overs : false;
    // We consider inning finished if: All Out OR (It is Last Over AND that over is Locked/Done and confirmed)
    // Actually, if it's the last over and isOverComplete, we should show "End Inning" even before locking?
    // No, we stick to "Lock -> Confirm -> End".
    // So: isAllOut OR (isLastOver AND currentOver?.isLocked).
    const isInningFinished = isAllOut || (isLastOver && currentOver?.isLocked);

    // Auto-Lock Over Effect
    useEffect(() => {
        if (!isOverComplete) {
            setAutoLockTriggered(false);
        } else if (isOverComplete && currentOver && !currentOver.isLocked && !autoLockTriggered) {
            setIsLockModalOpen(true);
            setAutoLockTriggered(true);
        }
    }, [isOverComplete, currentOver?.isLocked, autoLockTriggered]);

    // Score Handler Adapter
    const handleScore = async (type: any, runs: number, isWicket: boolean) => {
        if (currentOver?.isLocked || isOverComplete) return;

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

    // Calculate Eligible Bowlers
    const fieldingInning = currentMatch && currentInning ?
        currentMatch.innings[currentMatch.currentInningIndex === 0 ? 1 : 0]
        : undefined;

    const eligibleBowlers = fieldingInning?.players.filter(p =>
        p.id !== currentInning?.currentBowlerId
    ) || [];

    // Loading State
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-black">Loading...</div>;
    }

    if (!currentMatch) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-black">No Match Found</div>;
    }

    // Helper for Overs Display: 0.3 / 2
    const currentBalls = currentInning?.ballsBowled || 0;
    const overDisplay = `${Math.floor(currentBalls / 6)}.${currentBalls % 6}`;

    return (
        <div className="min-h-screen bg-black text-gray-200 pb-80 font-sans selection:bg-gray-800">
            {/* 1. Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        {currentMatch.teamA} VS {currentMatch.teamB}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs font-bold text-green-500">
                            {currentMatch.currentInningIndex === 0 ? currentMatch.teamA : currentMatch.teamB} Batting
                        </span>
                    </div>
                </div>
                <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-white relative">
                    <Share2 size={24} />
                    {/* Share icon used as placeholder for Menu/Share from image */}
                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1E] border border-gray-800 rounded-lg shadow-xl py-1 text-gray-200 z-50">
                            <button
                                onClick={() => navigate(`/match/${matchId}/summary`)}
                                className="block w-full text-left px-4 py-2 hover:bg-white/5"
                            >
                                Match Summary
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="block w-full text-left px-4 py-2 hover:bg-white/5 text-red-500"
                            >
                                Exit Match
                            </button>
                        </div>
                    )}
                </button>
            </div>

            {/* 2. Big Score Header */}
            <div className="flex flex-col items-center justify-center mt-6 mb-8">
                <div className="text-8xl font-black text-white tracking-tighter leading-none">
                    {currentInning?.totalRuns}<span className="text-gray-600 mx-1">/</span>{currentInning?.totalWickets}
                </div>
                <div className="text-lg text-gray-400 mt-2 font-medium tracking-wide">
                    Overs: <span className="text-white font-bold">{overDisplay}</span>
                    <span className="text-gray-600 mx-1">/</span>
                    {currentMatch.rules.overs}
                </div>
            </div>

            {/* 3. Batsman Card */}
            <div className="mx-4 mb-3 bg-[#1C1C1E] rounded-2xl overflow-hidden border border-gray-800/50">
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">BATSMAN</span>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">R (B)</span>
                </div>

                {/* Striker Row */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="font-bold text-white text-lg">
                            {striker?.name || "Select Batsman"} <span className="text-yellow-500 ml-0.5">*</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-green-500 font-bold text-xl">{striker?.batting.runs}</span>
                        <span className="text-gray-500 font-mono text-sm">({striker?.batting.balls})</span>
                    </div>
                </div>

                {/* Non-Striker Row */}
                <div className="flex justify-between items-center px-4 py-3 opacity-60">
                    <div className="flex items-center gap-2">
                        {/* Invisible dot for alignment */}
                        <div className="w-2 h-2 rounded-full bg-transparent"></div>
                        <span className="font-medium text-gray-300 text-lg">
                            {nonStriker?.name || "Non-Striker"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-300 font-bold text-xl">{nonStriker?.batting.runs}</span>
                        <span className="text-gray-600 font-mono text-sm">({nonStriker?.batting.balls})</span>
                    </div>
                </div>
            </div>

            {/* 4. Bowler Card */}
            <div className="mx-4 mb-6 bg-[#1C1C1E] rounded-2xl overflow-hidden border border-gray-800/50">
                <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">BOWLER</span>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">FIGURES</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                    <span className="font-bold text-white text-lg">{bowler?.name}</span>
                    <div className="font-mono text-white text-lg tracking-wider">
                        {bowler?.bowling.wickets} <span className="text-gray-600">-</span> {bowler?.bowling.runsConceded} <span className="text-gray-600">-</span> {Math.floor((bowler?.bowling.overs || 0))} <span className="text-gray-600">-</span> {bowler?.bowling.maidens}
                    </div>
                </div>
            </div>

            {/* 5. Current Over / CRR */}
            <div className="px-5">
                <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">CURRENT OVER</div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Placeholder for "New Over" text if empty, else balls */}
                    {currentOver?.balls.length === 0 ? (
                        <span className="text-gray-600 italic">New Over</span>
                    ) : (
                        currentOver?.balls.map((ball, i) => (
                            <div key={i} className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white font-bold text-sm border border-white/10">
                                {ball.isWicket ? 'W' : ball.runs}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 6. Footer Controls (Floating Keypad) */}
            {/* 6. Footer Controls (Floating Keypad) */}
            <div className="fixed bottom-4 left-4 w-full max-w-[380px] z-50">
                {isInningFinished ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-[#1C1C1E] rounded-3xl shadow-2xl border border-gray-800">
                        <div className="text-gray-400 mb-6 font-medium">Inning Completed</div>
                        <button
                            onClick={() => startNextOver()}
                            className="w-[85%] bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-green-500"
                        >
                            {currentMatch?.currentInningIndex === 0 ? "Start 2nd Inning" : "Finish Match"}
                        </button>
                    </div>
                ) : currentOver?.isLocked ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-[#1C1C1E] rounded-3xl shadow-2xl border border-gray-800">
                        <div className="text-gray-400 mb-6 font-medium">Over Completed</div>
                        <button
                            onClick={() => setShowBowlerSelect(true)}
                            className="w-[85%] bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform hover:bg-blue-500"
                        >
                            Start Next Over
                        </button>
                    </div>
                ) : (
                    <>
                        {!isOverComplete && !isAllOut && (
                            <ScoreButtons
                                onScore={handleScore}
                                onUndo={undoLastBall}
                                disabled={isOverComplete}
                            />
                        )}

                        {(isOverComplete || isAllOut) && (
                            <div className="py-4 text-center text-white/50 text-sm font-medium bg-[#1C1C1E]/80 rounded-2xl backdrop-blur-md animate-pulse border border-white/5">
                                {isAllOut ? "All Out!" : "Over Complete..."}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lock Confirmation Modal (Dark Theme) */}
            {isLockModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200 border border-gray-800">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                <AlertCircle size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Over Complete</h3>
                            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                                6 valid balls delivered.<br />Ready to start the next over?
                            </p>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => {
                                        undoLastBall();
                                        setIsLockModalOpen(false);
                                        setAutoLockTriggered(false);
                                    }}
                                    className="flex-1 py-3.5 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                                >
                                    Undo Last Ball
                                </button>
                                <button
                                    onClick={handleLockConfirm}
                                    className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 shadow-md transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals reused (PlayerSelectModal should adapt to dark theme if possible, but fine for now) */}
            {isStrikerSelectionNeeded && (
                <PlayerSelectModal
                    title="Select Next Batsman"
                    players={eligibleBatsmen}
                    onSelect={handleStrikerSelect}
                />
            )}
            {showBowlerSelect && (
                <PlayerSelectModal
                    title="Select Next Bowler"
                    players={eligibleBowlers}
                    onSelect={handleBowlerSelect}
                />
            )}
        </div>
    );
}
