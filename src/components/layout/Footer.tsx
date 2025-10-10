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

  return (
    <motion.footer 
      className="bg-gradient-to-t from-black to-transparent mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Footer Links - Three Column Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {footerLinks.map((column, columnIndex) => (
            <motion.div 
              key={columnIndex}
              className="space-y-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + columnIndex * 0.1 }}
            >
              {column.map((link, linkIndex) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + columnIndex * 0.1 + linkIndex * 0.05 }}
                >
                  <Link
                    to={link.to}
                    className="block text-xs text-text-secondary hover:text-text-primary transition-colors duration-200 py-1"
                  >
                    {link.label}
                  </Link>
                  {linkIndex < column.length - 1 && (
                    <div className="border-t border-white/10 my-1"></div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Copyright - Left aligned */}
        <motion.div 
          className="pt-3 border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-text-secondary text-left">
            © {currentYear} Aural • Hear desire, live fantasy
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};
