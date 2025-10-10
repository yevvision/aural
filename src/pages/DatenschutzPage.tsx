import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Trash2 } from 'lucide-react';

export const DatenschutzPage = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Privacy at Aural',
      content: 'We take the protection of your personal data very seriously. This privacy policy informs you about the nature, scope and purpose of processing personal data on our platform.'
    },
    {
      icon: Database,
      title: 'What data do we collect?',
      content: '• Email address (for registration)\n• Nickname (optional, can remain anonymous)\n• Audio recordings (only if you upload them)\n• Recording metadata (title, description, tags)\n• Usage statistics (anonymized)'
    },
    {
      icon: Lock,
      title: 'How do we protect your data?',
      content: '• SSL encryption for all transmissions\n• Secure servers with regular updates\n• No sharing with third parties without your consent\n• Anonymous usage possible\n• Regular security audits'
    },
    {
      icon: Eye,
      title: 'Your Rights',
      content: '• Right to information about stored data\n• Right to correction of incorrect data\n• Right to deletion of your data\n• Right to data portability\n• Right to object to processing'
    },
    {
      icon: Trash2,
      title: 'Data Deletion',
      content: 'You can delete your data at any time. Audio recordings are completely removed within 30 days of account deletion. Anonymous uploads can be deleted via the personal link.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-red-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="w-8 h-8 text-red-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-300">Your privacy is important to us</p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <section.icon className="w-6 h-6 text-red-400 mt-1" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {section.title}
                  </h2>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US')}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            For privacy questions, contact us at: privacy@aural.fun
          </p>
        </motion.div>
      </div>
    </div>
  );
};
