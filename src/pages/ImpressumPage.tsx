import { motion } from 'framer-motion';
import { Info, Mail, MapPin, Phone, Globe } from 'lucide-react';

export const ImpressumPage = () => {
  const contactInfo = [
    {
      icon: Globe,
      title: 'Website',
      content: 'aural.fun'
    },
    {
      icon: Mail,
      title: 'E-Mail',
      content: 'info@aural.fun'
    },
    {
      icon: MapPin,
      title: 'Business Address',
      content: 'Germany\n(Location will be added as needed)'
    },
    {
      icon: Phone,
      title: 'Contact',
      content: 'Via email or contact form'
    }
  ];

  const legalInfo = [
    {
      title: 'Responsible for Content',
      content: 'Aural Platform\nRepresented by: [Name will be added]\nEmail: legal@aural.fun'
    },
    {
      title: 'Hosting',
      content: 'Diese Website wird gehostet auf:\n• Netlify (Frontend)\n• Supabase (Backend)\n• AWS S3 (Dateispeicher)'
    },
    {
      title: 'Liability for Content',
      content: 'As a service provider, we are responsible for our own content on these pages according to the general laws pursuant to § 7 para.1 TMG.'
    },
    {
      title: 'Liability for Links',
      content: 'Our offer contains links to external websites of third parties, on whose contents we have no influence. Therefore, we cannot assume any guarantee for these external contents.'
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
            className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Info className="w-8 h-8 text-green-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Imprint</h1>
          <p className="text-gray-300">Information according to § 5 TMG</p>
        </motion.div>

        <div className="space-y-6">
          {/* Kontaktinformationen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <div key={info.title} className="flex items-start space-x-3">
                  <info.icon className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white">{info.title}</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-line">{info.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rechtliche Informationen */}
          {legalInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h2 className="text-xl font-semibold text-white mb-3">{info.title}</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{info.content}</p>
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
            This imprint is updated regularly.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
