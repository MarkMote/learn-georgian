import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define the types for the props the component will accept
interface BottomBarProps {
    isFlipped: boolean;
    isLeftHanded: boolean;
    onFlip: () => void;
    onRate: (difficulty: "easy" | "good" | "hard" | "fail") => void;
    onToggleHandedness: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
    isFlipped,
    isLeftHanded,
    onFlip,
    onRate,
    onToggleHandedness
}) => {
    return (
        <>
            {!isFlipped ? (
                // Show FLIP button
                <div className="absolute bottom-0 left-0 w-full flex text-white bg-neutral-950">
                    <button
                        onClick={onFlip} // Use prop function
                        className="flex-1 py-3 text-center border-t-4 border-gray-400 text-xl tracking-wide h-[70px] transition-colors"
                    >
                        Flip <span className="hidden md:inline">(Space)</span>
                    </button>
                </div>
            ) : (
                // Show RATING buttons with Left/Right Handed Mode Toggle
                <div className="absolute bottom-0 left-0 w-full h-[70px] text-xl font-semibold tracking-wide flex text-white bg-neutral-950 items-stretch"> {/* Use items-stretch */}

                    {!isLeftHanded ? (
                        // Right-Handed Layout (Default)
                        <>
                            {/* Switch to Left Button (Mobile Only) */}
                            <button
                                onClick={onToggleHandedness} // Use prop function
                                className="flex-shrink-0 basis-1/6 px-2 py-3 font-light text-center text-xs opacity-70 md:hidden flex items-center justify-center transition-colors border-t-4 border-gray-700"
                                aria-label="Switch to left-handed mode"
                                title="Switch Layout"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            {/* Rating Buttons */}
                            <div className="flex flex-grow">
                                <button
                                    onClick={() => onRate("fail")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-900/20 transition-colors"
                                    title="Fail (Q)"
                                >
                                    Fail <span className="hidden md:inline">(Q)</span>
                                </button>
                                <button
                                    onClick={() => onRate("hard")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-900/20 transition-colors"
                                    title="Hard (W)"
                                >
                                    Hard <span className="hidden md:inline">(W)</span>
                                </button>
                                <button
                                    onClick={() => onRate("good")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-900/20 transition-colors"
                                    title="Good (E)"
                                >
                                    Good <span className="hidden md:inline">(E)</span>
                                </button>
                                <button
                                    onClick={() => onRate("easy")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-900/20 transition-colors"
                                    title="Easy (R)"
                                >
                                    Easy <span className="hidden md:inline">(R)</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        // Left-Handed Layout
                        <>
                            {/* Rating Buttons */}
                            <div className="flex flex-grow">
                                <button
                                    onClick={() => onRate("fail")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-900/20 transition-colors"
                                    title="Fail (Q)"
                                >
                                    Fail <span className="hidden md:inline">(Q)</span>
                                </button>
                                <button
                                    onClick={() => onRate("hard")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-900/20 transition-colors"
                                    title="Hard (W)"
                                >
                                    Hard <span className="hidden md:inline">(W)</span>
                                </button>
                                <button
                                    onClick={() => onRate("good")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-900/20 transition-colors"
                                    title="Good (E)"
                                >
                                    Good <span className="hidden md:inline">(E)</span>
                                </button>
                                <button
                                    onClick={() => onRate("easy")} // Use prop function
                                    className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-900/20 transition-colors"
                                    title="Easy (R)"
                                >
                                    Easy <span className="hidden md:inline">(R)</span>
                                </button>
                            </div>

                            {/* Switch to Right Button (Mobile Only) */}
                            <button
                                onClick={onToggleHandedness} // Use prop function
                                className="flex-shrink-0 basis-1/6 px-2 py-3 font-light text-center text-xs opacity-70 md:hidden flex items-center justify-center hover:bg-gray-700 transition-colors border-t-4 border-gray-700"
                                aria-label="Switch to right-handed mode"
                                title="Switch Layout"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default BottomBar; 