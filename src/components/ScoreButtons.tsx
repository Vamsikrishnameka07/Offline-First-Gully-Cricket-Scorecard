import type { BallType } from '../types';
import { Undo2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ScoreButtonsProps {
    onScore: (type: BallType, runs: number, isWicket: boolean) => void;
    onUndo: () => void;
    disabled: boolean;
}

export default function ScoreButtons({ onScore, onUndo, disabled }: ScoreButtonsProps) {
    const btnClass = "h-16 rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center";

    return (
        <div className="grid grid-cols-4 gap-3 p-4 bg-neutral-900 pb-8 rounded-t-3xl border-t border-neutral-800">
            {/* Row 1: 0, 1, 2, 3 */}
            <button onClick={() => onScore("DOT", 0, false)} disabled={disabled} className={cn(btnClass, "bg-neutral-800 text-neutral-400 hover:bg-neutral-700")}>0</button>
            <button onClick={() => onScore("RUN", 1, false)} disabled={disabled} className={cn(btnClass, "bg-neutral-800 text-white hover:bg-neutral-700")}>1</button>
            <button onClick={() => onScore("RUN", 2, false)} disabled={disabled} className={cn(btnClass, "bg-neutral-800 text-white hover:bg-neutral-700")}>2</button>
            <button onClick={() => onScore("RUN", 3, false)} disabled={disabled} className={cn(btnClass, "bg-neutral-800 text-white hover:bg-neutral-700")}>3</button>

            {/* Row 2: 4, 6, W, Undo */}
            <button onClick={() => onScore("FOUR", 4, false)} disabled={disabled} className={cn(btnClass, "bg-blue-600 text-white hover:bg-blue-700")}>4</button>
            <button onClick={() => onScore("SIX", 6, false)} disabled={disabled} className={cn(btnClass, "bg-purple-600 text-white hover:bg-purple-700")}>6</button>
            <button onClick={() => onScore("WICKET", 0, true)} disabled={disabled} className={cn(btnClass, "bg-red-600 text-white hover:bg-red-700")}>OUT</button>

            <button onClick={onUndo} className={cn(btnClass, "bg-neutral-800 text-yellow-500 hover:bg-neutral-700")}>
                <Undo2 size={24} />
            </button>

            {/* Row 3: Extras (optional but kept per spec 'Flexible Rules') - actually User spec didn't explicitly ask for Wide buttons on main screen but "Flexible rules". 
          I'll keep it simple: Just Dot, 1,2,3,4,6,W, Undo for MVP.
          Maybe Wide/NoBall can be added later or via long press?
          I added BallType WIDE in types.
          Let's add 'Wd' and 'Nb' buttons? Or stick to strict "One-tap" requirements.
          "Buttons: Dot, 1 2 3, 4 6, Wicket, Undo". That's it.
          So user might treat Wide as '1' or 'Dot' + extra manually? 
          Or maybe I should adhere strictly to the "Buttons" list.
          "Buttons: Dot, 1 2 3, 4 6, Wicket, Undo". Explicit list.
          I will just stick to this.
          Wait, "Flexible gully rules" usually implies wides handling. 
          But the UI spec listed specific buttons. I'll stick to those for the Screen 2.
       */}
        </div>
    );
}
