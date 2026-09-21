import { motion } from 'framer-motion';
import { brand } from '../theme/brand.js';

export default function AnimatedBackground() {
  const { purple, blue, orange, yellow } = brand.palette;
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink-900">
      <motion.div
        className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full blur-[130px]"
        style={{ background: `${purple[500]}1f` }}
        animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-48 -right-24 h-[32rem] w-[32rem] rounded-full blur-[150px]"
        style={{ background: `${blue[500]}1f` }}
        animate={{ x: [0, -36, 0], y: [0, -20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full blur-[130px]"
        style={{ background: `${orange[500]}14` }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 left-1/4 h-[20rem] w-[20rem] rounded-full blur-[120px]"
        style={{ background: `${yellow[500]}0d` }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
    </div>
  );
}
