import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Trash2, Clock, ExternalLink } from 'lucide-react';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

export const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto min-h-screen relative bg-transparent">
      {/* Spacer for fixed header */}
      <div className="h-[72px]"></div>

      <div className="px-6 pb-6 min-h-[calc(100vh-72px)]">
        <PageTransition>
          <StaggerWrapper>
            {/* Header */}
            <StaggerItem>
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Shield className="w-10 h-10 text-orange-500" />
                </motion.div>
                
                <h1 className="text-4xl font-bold text-white mb-4">
                  Sicherheit & Missbrauchsschutz
                </h1>
                
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Wir schützen Aural vor automatisierten Uploads und Missbrauch, 
                  während wir deine Privatsphäre respektieren.
                </p>
              </div>
            </StaggerItem>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Cap Proof-of-Work */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Proof-of-Work Bot-Schutz
                        </h2>
                        <p className="text-gray-300">
                          Wir verwenden das Open-Source-Projekt Cap, um automatische Uploads zu verhindern.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Wie funktioniert es?
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Dein Browser löst ein mathematisches Rätsel (unsichtbar für dich)</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Größere Dateien erfordern mehr Rechenleistung</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Bots können diese Rechenleistung nicht effizient aufbringen</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <ExternalLink size={16} />
                        <a 
                          href="https://github.com/tiagozip/cap" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-500 hover:text-orange-400 transition-colors"
                        >
                          Cap auf GitHub ansehen
                        </a>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </StaggerItem>

              {/* Upload-Limits */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Upload-Limits pro Gerät
                        </h2>
                        <p className="text-gray-300">
                          Wir begrenzen die Upload-Häufigkeit, um Missbrauch zu verhindern.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          30-Minuten-Limit
                        </h3>
                        <p className="text-3xl font-bold text-orange-500 mb-2">3</p>
                        <p className="text-gray-400 text-sm">
                          Maximal 3 Uploads alle 30 Minuten
                        </p>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Tages-Limit
                        </h3>
                        <p className="text-3xl font-bold text-orange-500 mb-2">5</p>
                        <p className="text-gray-400 text-sm">
                          Maximal 5 Uploads pro Tag
                        </p>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Audio-Zeit
                        </h3>
                        <p className="text-3xl font-bold text-orange-500 mb-2">120</p>
                        <p className="text-gray-400 text-sm">
                          Maximal 120 Minuten Audio pro Tag
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </StaggerItem>

              {/* Duplicate Detection */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Eye className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Duplikat-Erkennung
                        </h2>
                        <p className="text-gray-300">
                          Wir erkennen identische Dateien und prüfen verdächtige Uploads manuell.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-3">
                          Wie funktioniert die Erkennung?
                        </h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Jede Datei wird mit SHA-256 gehasht</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Ab 5 identischen Uploads → verdächtig</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>Verdächtige Uploads werden manuell geprüft</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </StaggerItem>

              {/* Data Retention */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Speicherfristen
                        </h2>
                        <p className="text-gray-300">
                          Wir löschen Sicherheitsdaten automatisch nach 30 Tagen.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Zähler & Datei-Hashes
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Upload-Zähler und Datei-Hashes werden nach 30 Tagen automatisch gelöscht.
                        </p>
                      </div>
                      
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">
                          Pending-Einträge
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Ausstehende Uploads werden 30 Tage nach Entscheidung gelöscht.
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </StaggerItem>

              {/* Privacy Statement */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Datenschutz-Garantie
                    </h2>
                    
                    <div className="space-y-4 text-gray-300">
                      <p>
                        <strong className="text-white">Keine Weitergabe an Dritte:</strong> 
                        Wir geben keine personenbezogenen Daten an Dritte weiter.
                      </p>
                      
                      <p>
                        <strong className="text-white">Lokale Verarbeitung:</strong> 
                        Alle Sicherheitschecks laufen lokal in deinem Browser ab.
                      </p>
                      
                      <p>
                        <strong className="text-white">Minimale Datensammlung:</strong> 
                        Wir sammeln nur die nötigsten Daten für den Missbrauchsschutz.
                      </p>
                      
                      <p>
                        <strong className="text-white">Transparenz:</strong> 
                        Du siehst immer, warum ein Upload zur manuellen Prüfung eingereicht wird.
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              </StaggerItem>

              {/* Contact */}
              <StaggerItem>
                <RevealOnScroll>
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Fragen oder Bedenken?
                    </h2>
                    <p className="text-gray-300 mb-6">
                      Wenn du Fragen zu unseren Sicherheitsmaßnahmen hast oder 
                      ein Upload fälschlicherweise blockiert wurde, melde dich gerne.
                    </p>
                    <button className="px-6 py-3 bg-orange-500/20 border border-orange-500 rounded-lg text-orange-500 font-medium hover:bg-orange-500/30 transition-all duration-200">
                      Kontakt aufnehmen
                    </button>
                  </div>
                </RevealOnScroll>
              </StaggerItem>
            </div>
          </StaggerWrapper>
        </PageTransition>
      </div>
    </div>
  );
};
