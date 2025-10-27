import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const footerLinks = [
        [
            { to: '/datenschutz', label: 'Privacy Policy' },
            { to: '/agb', label: 'Terms of Service' },
            { to: '/impressum', label: 'Imprint' },
        ],
        [
            { to: '/richtlinien', label: 'Community Guidelines' },
            { to: '/sicherheit', label: 'Safety & Report' },
            { to: '/hilfe', label: 'Help & Support' },
        ],
        [
            { to: '/about', label: 'About Us' },
            { to: '/kontakt', label: 'Contact' },
            { to: '/faq', label: 'FAQ' },
        ]
    ];
    return (_jsx(motion.footer, { className: "bg-gradient-to-t from-black to-transparent mt-auto", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, children: _jsxs("div", { className: "max-w-md mx-auto px-4 py-4", children: [_jsx("div", { className: "grid grid-cols-3 gap-4 mb-4", children: footerLinks.map((column, columnIndex) => (_jsx(motion.div, { className: "space-y-0", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 + columnIndex * 0.1 }, children: column.map((link, linkIndex) => (_jsxs(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay: 0.3 + columnIndex * 0.1 + linkIndex * 0.05 }, children: [_jsx(Link, { to: link.to, className: "block text-xs text-text-secondary hover:text-text-primary transition-colors duration-200 py-1", children: link.label }), linkIndex < column.length - 1 && (_jsx("div", { className: "border-t border-white/10 my-1" }))] }, link.to))) }, columnIndex))) }), _jsx(motion.div, { className: "pt-3 border-t border-white/5", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, children: _jsxs("p", { className: "text-xs text-text-secondary text-left", children: ["\u00A9 ", currentYear, " Aural \u2022 Hear desire, live fantasy"] }) })] }) }));
};
