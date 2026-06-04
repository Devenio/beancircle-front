'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { BeanLogo } from './bean-logo';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function LoginHero() {
  const t = useTranslations('auth');

  return (
    <LazyMotion features={domAnimation}>
      <m.header
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center px-2 pt-2 text-center"
      >
        <m.div variants={item} className="relative mb-5">
          <m.div
            className="absolute inset-0 -m-4 rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(245,184,120,0.45) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <BeanLogo className="relative h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20" />
        </m.div>
        <m.p
          variants={item}
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/70"
        >
          BeanCircle
        </m.p>
        <m.h1
          variants={item}
          className="mt-2 max-w-[18rem] text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-3xl"
        >
          {t('heroTitle')}
        </m.h1>
        <m.p
          variants={item}
          className="mt-2.5 max-w-[20rem] text-[15px] leading-relaxed text-white/55"
        >
          {t('heroSubtitle')}
        </m.p>
      </m.header>
    </LazyMotion>
  );
}
