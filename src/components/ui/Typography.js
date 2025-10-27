import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';
export const Text = ({ variant = 'body', weight = 'normal', color = 'primary', gradient = false, className, children, ...props }) => {
    // Variant styles based on design system
    const variantClasses = {
        headline: 'text-headline', // 28px, normal weight, tight spacing
        title: 'text-2xl font-normal leading-tight tracking-tight',
        subtitle: 'text-xl font-normal leading-relaxed',
        body: 'text-body', // 16px, normal weight
        'body-lg': 'text-lg font-normal leading-relaxed',
        'body-sm': 'text-sm font-normal leading-relaxed',
        label: 'text-label', // 12px, uppercase, wide tracking
        caption: 'text-xs font-normal leading-relaxed tracking-wide'
    };
    // Weight classes
    const weightClasses = {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
    };
    // Color classes
    const colorClasses = {
        primary: 'text-text-primary',
        secondary: 'text-text-secondary',
        tertiary: 'text-text-tertiary',
        accent: 'text-gradient-strong',
        gradient: 'text-gradient-primary'
    };
    const classes = cn(variantClasses[variant], weightClasses[weight], gradient || color === 'gradient' ? 'text-gradient-primary' : colorClasses[color], className);
    return (_jsx(motion.p, { className: classes, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, ...props, children: children }));
};
export const Heading = ({ level = 1, gradient = false, className, children, ...props }) => {
    const levelClasses = {
        1: 'text-3xl md:text-4xl font-normal leading-tight tracking-tight',
        2: 'text-2xl md:text-3xl font-normal leading-tight tracking-tight',
        3: 'text-xl md:text-2xl font-normal leading-snug',
        4: 'text-lg md:text-xl font-normal leading-snug',
        5: 'text-base md:text-lg font-normal leading-normal',
        6: 'text-sm md:text-base font-normal leading-normal'
    };
    const classes = cn(levelClasses[level], gradient ? 'text-gradient-primary' : 'text-text-primary', className);
    const HeadingComponent = ({ children, className, ...rest }) => {
        switch (level) {
            case 1: return _jsx("h1", { className: className, ...rest, children: children });
            case 2: return _jsx("h2", { className: className, ...rest, children: children });
            case 3: return _jsx("h3", { className: className, ...rest, children: children });
            case 4: return _jsx("h4", { className: className, ...rest, children: children });
            case 5: return _jsx("h5", { className: className, ...rest, children: children });
            case 6: return _jsx("h6", { className: className, ...rest, children: children });
            default: return _jsx("h1", { className: className, ...rest, children: children });
        }
    };
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" }, children: _jsx(HeadingComponent, { className: classes, ...props, children: children }) }));
};
// Specialized Typography Components
export const Headline = (props) => (_jsx(Text, { variant: "headline", ...props }));
export const Title = (props) => (_jsx(Text, { variant: "title", ...props }));
export const Subtitle = (props) => (_jsx(Text, { variant: "subtitle", ...props }));
export const Body = (props) => (_jsx(Text, { variant: "body", ...props }));
export const Label = (props) => (_jsx(Text, { variant: "label", ...props }));
export const Caption = (props) => (_jsx(Text, { variant: "caption", ...props }));
export const GradientText = ({ from = 'var(--gradient-strong)', to = 'var(--gradient-deep)', className, style, children, ...props }) => {
    return (_jsx(Text, { className: cn('text-gradient-primary', className), style: {
            background: `linear-gradient(135deg, ${from}, ${to})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            ...style
        }, ...props, children: children }));
};
export const AnimatedCounter = ({ value, duration = 1, className, prefix = '', suffix = '' }) => {
    return (_jsx(motion.span, { className: className, initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.3 }, children: _jsxs(motion.span, { initial: { y: 20 }, animate: { y: 0 }, transition: { duration }, children: [prefix, _jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration, delay: 0.1 }, children: value.toLocaleString() }), suffix] }) }));
};
export const Quote = ({ children, author, className }) => {
    return (_jsxs(motion.blockquote, { className: cn('relative panel-floating p-6 italic text-lg leading-relaxed', className), initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 }, children: [_jsxs("div", { className: "text-text-secondary mb-4", children: ["\"", children, "\""] }), author && (_jsxs("footer", { className: "text-text-tertiary font-medium text-sm", children: ["\u2014 ", author] })), _jsx("div", { className: "absolute top-4 left-4 text-6xl text-gradient-strong/20 font-serif leading-none", children: "\"" })] }));
};
export const TypewriterText = ({ text, speed = 50, delay = 0, ...props }) => {
    const [displayText, setDisplayText] = React.useState('');
    const [currentIndex, setCurrentIndex] = React.useState(0);
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (currentIndex < text.length) {
                setDisplayText(prev => prev + text[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }
        }, currentIndex === 0 ? delay : speed);
        return () => clearTimeout(timer);
    }, [currentIndex, text, speed, delay]);
    return (_jsxs(Text, { ...props, children: [displayText, currentIndex < text.length && (_jsx(motion.span, { className: "inline-block w-0.5 h-1em bg-gradient-strong ml-1", animate: { opacity: [1, 0] }, transition: { duration: 0.8, repeat: Infinity } }))] }));
};
