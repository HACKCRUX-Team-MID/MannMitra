import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    glowEffect?: boolean;
    gradient?: boolean;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hoverEffect = false,
    glowEffect = false,
    gradient = false,
    style,
    onClick,
}) => {
    const classes = [
        'card',
        hoverEffect ? 'card-hover' : '',
        glowEffect ? 'card-glow' : '',
        gradient ? 'gradient-border' : '',
        onClick ? 'cursor-pointer' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} style={style} onClick={onClick}>
            {children}
        </div>
    );
};

export default Card;
