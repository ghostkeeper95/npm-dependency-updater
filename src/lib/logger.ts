export const log = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string) => console.warn(`⚠️  ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  step: (msg: string) => console.log(`   → ${msg}`),
  header: (msg: string) => console.log(`\n📦 ${msg}`),
};
