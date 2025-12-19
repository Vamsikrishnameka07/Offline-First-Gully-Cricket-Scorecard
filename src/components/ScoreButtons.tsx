import type { BallType } from '../types';
import { Undo2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ScoreButtonsProps {
    onScore: (type: BallType, runs: number, isWicket: boolean) => void;
    onUndo: () => void;
    disabled: boolean;
}

export default function ScoreButtons({ onScore, onUndo, disabled }: ScoreButtonsProps) {
    const btnClass = "h-14 rounded-2xl font-bold text-xl shadow-sm active:scale-95 transition-all flex items-center justify-center";
    const neutralBtn = "bg-[#2C2C2E] text-white hover:bg-[#3A3A3C]";

    return (
        <div className="grid grid-cols-4 gap-3 p-4 bg-[#1C1C1E] rounded-3xl shadow-2xl border border-gray-800">
            {/* Row 1: 0, 1, 2, 3 */}
            <button onClick={() => onScore("DOT", 0, false)} disabled={disabled} className={cn(btnClass, neutralBtn, "text-gray-400")}>0</button>
            <button onClick={() => onScore("RUN", 1, false)} disabled={disabled} className={cn(btnClass, neutralBtn)}>1</button>
            <button onClick={() => onScore("RUN", 2, false)} disabled={disabled} className={cn(btnClass, neutralBtn)}>2</button>
            <button onClick={() => onScore("RUN", 3, false)} disabled={disabled} className={cn(btnClass, neutralBtn)}>3</button>

            {/* Row 2: 4, 6, W, Undo */}
            <button onClick={() => onScore("FOUR", 4, false)} disabled={disabled} className={cn(btnClass, "bg-[#3478F6] text-white hover:bg-blue-500")}>4</button>
            <button onClick={() => onScore("SIX", 6, false)} disabled={disabled} className={cn(btnClass, "bg-[#AF52DE] text-white hover:bg-purple-500")}>6</button>
            <button onClick={() => onScore("WICKET", 0, true)} disabled={disabled} className={cn(btnClass, "bg-[#FF3B30] text-white hover:bg-red-500")}>OUT</button>

            <button onClick={onUndo} className={cn(btnClass, "bg-[#2C2C2E] text-yellow-500 hover:bg-[#3A3A3C]")}>
                <Undo2 size={24} />
            </button>
        </div>
    );
}
