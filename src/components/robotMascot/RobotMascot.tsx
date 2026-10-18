import React, { useEffect, useState } from "react";

interface RobotMascotProps {
    size?: number;
    className?: string;
    autoBlink?: boolean;
}

const RobotMascot: React.FC<RobotMascotProps> = ({ size = 120, className, autoBlink = true }) => {
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        if (!autoBlink || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
        const interval = setInterval(
            () => {
                setBlink(true);
                blinkTimeout = setTimeout(() => setBlink(false), 180);
            },
            2200 + Math.random() * 1200,
        );
        return () => {
            clearInterval(interval);
            if (blinkTimeout) {
                clearTimeout(blinkTimeout);
            }
        };
    }, [autoBlink]);

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <ellipse cx="60" cy="70" rx="38" ry="32" fill="#4f8ef7" opacity="0.12" />
            <rect x="32" y="38" width="56" height="44" rx="16" fill="#fff" stroke="#4f8ef7" strokeWidth="3" />
            <rect x="44" y="52" width="32" height="16" rx="8" fill="#e0e7ef" />
            {blink ? (
                <>
                    <rect x="44" y="58" width="8" height="4" rx="2" fill="#4f8ef7" />
                    <rect x="68" y="58" width="8" height="4" rx="2" fill="#4f8ef7" />
                </>
            ) : (
                <>
                    <circle cx="48" cy="60" r="4" fill="#4f8ef7" />
                    <circle cx="72" cy="60" r="4" fill="#4f8ef7" />
                </>
            )}
            <rect x="56" y="68" width="8" height="4" rx="2" fill="#4f8ef7" />
            <rect x="58" y="32" width="4" height="10" rx="2" fill="#4f8ef7" />
            <rect x="32" y="80" width="8" height="12" rx="4" fill="#4f8ef7" />
            <rect x="80" y="80" width="8" height="12" rx="4" fill="#4f8ef7" />
        </svg>
    );
};

export default RobotMascot;
