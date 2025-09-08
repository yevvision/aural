import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// Typography variants
type TextVariant = 'headline' | 'title' | 'subtitle' | 'body' | 'body-lg' | 'body-sm' | 'label' | 'caption';
type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'gradient';

// Base Text Component
interface TextProps extends HTMLMotionProps<'p'> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  gradient?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight = 'normal',
  color = 'primary',
  gradient = false,
  className,
  children,
  ...props
}) => {
  // Variant styles based on design system
  const variantClasses = {
    headline: 'text-headline', // 28px, bold, tight spacing
    title: 'text-2xl font-bold leading-tight tracking-tight',
    subtitle: 'text-xl font-semibold leading-relaxed',
    body: 'text-body', // 16px, medium weight
    'body-lg': 'text-lg font-medium leading-relaxed',
    'body-sm': 'text-sm font-medium leading-relaxed',
    label: 'text-label', // 12px, uppercase, wide tracking
    caption: 'text-xs font-medium leading-relaxed tracking-wide'
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

  const classes = cn(
    variantClasses[variant],
    weightClasses[weight],
    gradient || color === 'gradient' ? 'text-gradient-primary' : colorClasses[color],
    className
  );

  return (
    <motion.p
      className={classes}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.p>
  );
};

// Heading Components
interface HeadingProps extends Omit<HTMLMotionProps<'h1'>, 'children'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  level = 1,
  gradient = false,
  className,
  children,
  ...props
}) => {
  const levelClasses = {
    1: 'text-4xl md:text-5xl font-bold leading-tight tracking-tight',
    2: 'text-3xl md:text-4xl font-bold leading-tight tracking-tight',
    3: 'text-2xl md:text-3xl font-bold leading-snug',
    4: 'text-xl md:text-2xl font-semibold leading-snug',
    5: 'text-lg md:text-xl font-semibold leading-normal',
    6: 'text-base md:text-lg font-semibold leading-normal'
  };

  const classes = cn(
    levelClasses[level],
    gradient ? 'text-gradient-primary' : 'text-text-primary',
    className
  );

  const HeadingComponent = ({ children, className, ...rest }: any) => {
    switch (level) {
      case 1: return <h1 className={className} {...rest}>{children}</h1>;
      case 2: return <h2 className={className} {...rest}>{children}</h2>;
      case 3: return <h3 className={className} {...rest}>{children}</h3>;
      case 4: return <h4 className={className} {...rest}>{children}</h4>;
      case 5: return <h5 className={className} {...rest}>{children}</h5>;
      case 6: return <h6 className={className} {...rest}>{children}</h6>;
      default: return <h1 className={className} {...rest}>{children}</h1>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <HeadingComponent className={classes} {...props}>
        {children}
      </HeadingComponent>
    </motion.div>
  );
};

// Specialized Typography Components
export const Headline: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="headline" {...props} />
);

export const Title: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="title" {...props} />
);

export const Subtitle: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="subtitle" {...props} />
);

export const Body: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

export const Label: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="label" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="caption" {...props} />
);

// Gradient Text Component
interface GradientTextProps extends Omit<TextProps, 'color' | 'gradient'> {
  from?: string;
  to?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  from = 'var(--gradient-strong)',
  to = 'var(--gradient-deep)',
  className,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      className={cn('text-gradient-primary', className)}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...style
      }}
      {...props}
    >
      {children}
    </Text>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  className,
  prefix = '',
  suffix = ''
}) => {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration }}
      >
        {prefix}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, delay: 0.1 }}
        >
          {value.toLocaleString()}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
};

// Quote Component
interface QuoteProps {
  children: React.ReactNode;
  author?: string;
  className?: string;
}

export const Quote: React.FC<QuoteProps> = ({ children, author, className }) => {
  return (
    <motion.blockquote
      className={cn(
        'relative panel-floating p-6 italic text-lg leading-relaxed',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-text-secondary mb-4">
        "{children}"
      </div>
      {author && (
        <footer className="text-text-tertiary font-medium text-sm">
          — {author}
        </footer>
      )}
      
      {/* Quote decoration */}
      <div className="absolute top-4 left-4 text-6xl text-gradient-strong/20 font-serif leading-none">
        "
      </div>
    </motion.blockquote>
  );
};

// Text with typing animation
interface TypewriterTextProps extends Omit<TextProps, 'children'> {
  text: string;
  speed?: number;
  delay?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 0,
  ...props
}) => {
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

  return (
    <Text {...props}>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          className="inline-block w-0.5 h-1em bg-gradient-strong ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </Text>
  );
};