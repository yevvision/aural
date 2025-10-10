import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Shield, Users, Mic, Heart } from 'lucide-react';

export const AGBPage = () => {
  const sections = [
    {
      icon: AlertTriangle,
      title: 'Age Restriction',
      content: 'This platform is exclusively for persons aged 18 and over. By using it, you confirm that you are of legal age.'
    },
    {
      icon: Shield,
      title: 'Terms of Use',
      content: '• No illegal content (violence, minors, non-consensual sex)\n• Respectful interaction in comments\n• No commercial use without permission\n• Upload only your own content or with permission\n• No spam or advertising'
    },
    {
      icon: Mic,
      title: 'Audio Content',
      content: '• All uploads are at your own responsibility\n• Anonymous uploads are possible\n• No downloading of recordings by third parties\n• Report inappropriate content\n• No guarantee for content availability'
    },
    {
      icon: Users,
      title: 'Community Guidelines',
      content: '• Respectful interaction with each other\n• No harassment or discrimination\n• Constructive comments welcome\n• Report violations\n• Moderation rights reserved'
    },
    {
      icon: Heart,
      title: 'Disclaimer',
      content: 'Aural is not liable for third-party content. Use is at your own risk. We assume no responsibility for damages caused by using the platform.'
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
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FileText className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-300">Terms of use for Aural</p>
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
                  <section.icon className="w-6 h-6 text-blue-400 mt-1" />
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
            For questions about the terms, contact us at: legal@aural.fun
          </p>
        </motion.div>
      </div>
    </div>
  );
};
