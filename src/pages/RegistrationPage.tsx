import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, User, Lock, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../stores/registrationStore';
import { 
  PageTransition, 
  StaggerWrapper, 
  StaggerItem, 
  RevealOnScroll
} from '../components/ui';

// German spec: Multi-step registration flow as defined in specification
export const RegistrationPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    data,
    currentStep,
    steps,
    errors,
    isLoading,
    isComplete,
    setUsername,
    setPassword,
    setConfirmPassword,
    setEmail,
    setIsOver18,
    nextStep,
    previousStep,
    validateCurrentStep,
    submitRegistration,
    canProceed,
    getStepProgress,
  } = useRegistrationStore();

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === 4) {
        // Final step - submit registration
        submitRegistration().then(success => {
          if (success) {
            // Registration complete - could redirect to welcome or login
            console.log('Registration completed successfully');
          }
        });
      } else {
        nextStep();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      previousStep();
    } else {
      navigate('/');
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  if (isComplete) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-4 py-6 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <RevealOnScroll direction="up">
              <div className="true-black-card text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center">
                  <Check size={32} className="text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-text-primary mb-2">
                    Willkommen bei Aural!
                  </h1>
                  <p className="text-text-secondary">
                    Deine Registrierung war erfolgreich. Du kannst jetzt loslegen!
                  </p>
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 bg-gradient-primary rounded-lg text-white font-medium 
                           hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                >
                  Zur App
                </button>
              </div>
            </RevealOnScroll>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <RevealOnScroll direction="up">
          <div className="true-black-card">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center 
                         hover:bg-white/20 transition-colors duration-200"
                aria-label="Zurück"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </button>
              
              <h1 className="text-lg font-semibold text-text-primary">Registrierung</h1>
              
              <div className="w-10" /> {/* Spacer */}
            </div>
          </div>
        </RevealOnScroll>

        {/* Progress Bar */}
        <RevealOnScroll direction="up" delay={0.1}>
          <div className="true-black-card">
            <div className="w-full bg-white/10 rounded-full h-2 mb-6">
              <motion.div
                className="h-full bg-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getStepProgress()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Step 1: Username */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary/20 mx-auto flex items-center justify-center mb-4">
                      <User size={24} className="text-gradient-strong" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">
                      Username eingeben
                    </h2>
                    <p className="text-text-secondary">
                      Wähle deinen einzigartigen Benutzernamen
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Benutzername *
                    </label>
                    <input
                      type="text"
                      value={data.username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="z.B. audio_lover"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-text-primary 
                               placeholder-text-secondary focus:outline-none transition-all duration-200 ${
                                 getFieldError('username')
                                   ? 'border-red-500 focus:border-red-500'
                                   : 'border-white/10 focus:border-accent-violet/50 focus:bg-white/10'
                               }`}
                      maxLength={20}
                    />
                    {getFieldError('username') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('username')}</p>
                    )}
                    <div className="text-right text-xs text-text-secondary mt-1">
                      {data.username.length}/20
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Password */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary/20 mx-auto flex items-center justify-center mb-4">
                      <Lock size={24} className="text-gradient-strong" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">
                      Passwort erstellen
                    </h2>
                    <p className="text-text-secondary">
                      Wähle ein sicheres Passwort für dein Konto
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Passwort *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindestens 8 Zeichen"
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-text-primary 
                                 placeholder-text-secondary focus:outline-none transition-all duration-200 pr-12 ${
                                   getFieldError('password')
                                     ? 'border-red-500 focus:border-red-500'
                                     : 'border-white/10 focus:border-accent-violet/50 focus:bg-white/10'
                                 }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary 
                                 hover:text-text-primary transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                      </button>
                    </div>
                    {getFieldError('password') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('password')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Passwort bestätigen *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={data.confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Passwort wiederholen"
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-text-primary 
                                 placeholder-text-secondary focus:outline-none transition-all duration-200 pr-12 ${
                                   getFieldError('confirmPassword')
                                     ? 'border-red-500 focus:border-red-500'
                                     : 'border-white/10 focus:border-accent-violet/50 focus:bg-white/10'
                                 }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary 
                                 hover:text-text-primary transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                      </button>
                    </div>
                    {getFieldError('confirmPassword') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('confirmPassword')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Email (Optional) */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-turquoise/20 mx-auto flex items-center justify-center mb-4">
                      <Mail size={24} className="text-accent-turquoise" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">
                      E-Mail hinzufügen
                    </h2>
                    <p className="text-text-secondary">
                      Optional für Passwort-Wiederherstellung
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      E-Mail (Optional)
                    </label>
                    <input
                      type="email"
                      value={data.email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.com"
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-text-primary 
                               placeholder-text-secondary focus:outline-none transition-all duration-200 ${
                                 getFieldError('email')
                                   ? 'border-red-500 focus:border-red-500'
                                   : 'border-white/10 focus:border-accent-violet/50 focus:bg-white/10'
                               }`}
                    />
                    {getFieldError('email') && (
                      <p className="text-red-400 text-sm mt-1">{getFieldError('email')}</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">
                      Du kannst diesen Schritt überspringen
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Age Verification */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-blue/20 mx-auto flex items-center justify-center mb-4">
                      <Shield size={24} className="text-accent-blue" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">
                      Altersbestätigung
                    </h2>
                    <p className="text-text-secondary">
                      Bestätige, dass du mindestens 18 Jahre alt bist
                    </p>
                  </div>

                  <div className="true-black-card">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.isOver18}
                        onChange={(e) => setIsOver18(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-2 border-white/20 text-gradient-strong 
                                 focus:ring-gradient-strong focus:ring-2 focus:ring-offset-0 
                                 bg-transparent checked:bg-gradient-strong checked:border-gradient-strong"
                      />
                      <div className="flex-1">
                        <p className="text-text-primary font-medium mb-1">
                          Ich bestätige, dass ich mindestens 18 Jahre alt bin
                        </p>
                        <p className="text-text-secondary text-sm">
                          Diese App ist nur für Erwachsene bestimmt und kann explizite Inhalte enthalten.
                        </p>
                      </div>
                    </label>
                    {getFieldError('isOver18') && (
                      <p className="text-red-400 text-sm mt-3">{getFieldError('isOver18')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {errors.some(e => e.field === 'general') && (
                <RevealOnScroll direction="up">
                  <div className="true-black-card p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm text-center">
                      {errors.find(e => e.field === 'general')?.message}
                    </p>
                  </div>
                </RevealOnScroll>
              )}

              {/* Navigation Buttons */}
              <div className="flex space-x-4 pt-6">
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 bg-white/10 rounded-lg text-text-secondary font-medium 
                             hover:bg-white/20 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft size={18} strokeWidth={2} />
                    <span>Zurück</span>
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="flex-1 py-3 bg-gradient-primary rounded-lg text-white font-medium 
                           hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Wird bearbeitet...</span>
                    </>
                  ) : currentStep === 4 ? (
                    <>
                      <Check size={18} strokeWidth={2} />
                      <span>Registrierung abschließen</span>
                    </>
                  ) : (
                    <>
                      <span>Weiter</span>
                      <ArrowRight size={18} strokeWidth={2} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </RevealOnScroll>
      </div>
    </PageTransition>
  );
};