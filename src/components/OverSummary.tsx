import type { Ball } from '../types';
import { cn } from '../utils/cn'; // Need to create cn utility

export default function OverSummary({ balls }: { balls: Ball[] }) {
    return (
        <div className="flex gap-2 mb-4 overflow-x-auto p-1">
            {balls.map((ball, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm shrink-0",
                        ball.isWicket ? "bg-red-500 text-white" :
                            ball.runs === 4 ? "bg-blue-500 text-white" :
                                ball.runs === 6 ? "bg-purple-600 text-white" :
                                    !ball.isValid ? "bg-orange-400 text-black" : // Wide/NoBall
                                        ball.runs === 0 ? "bg-neutral-700 text-neutral-400" :
                                            "bg-neutral-800 text-white"
                    )}
                >
                    {ball.isWicket ? 'W' :
                        !ball.isValid ? (ball.type === "WIDE" ? 'Wd' : 'Nb') :
                            ball.runs}
                </div>
            ))}
            {balls.length === 0 && (
                <span className="text-neutral-500 text-sm py-1">New Over</span>
            )}
        </div>
    );
}
