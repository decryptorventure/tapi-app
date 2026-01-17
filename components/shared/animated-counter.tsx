'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

export function AnimatedCounter({
    value,
    duration = 1000,
    className = '',
    suffix = '',
    prefix = ''
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = displayValue;
        const endValue = value;

        if (startValue === endValue) return;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function: easeOutExpo
            const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
            setDisplayValue(currentValue);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        startTimeRef.current = null;
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{displayValue.toLocaleString('vi-VN')}{suffix}
        </span>
    );
}
