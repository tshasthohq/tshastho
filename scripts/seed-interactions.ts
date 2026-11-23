import { seedCommonInteractions } from '../src/lib/pharmacy/interactions';
seedCommonInteractions().then((n) => { console.log('created:', n); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
