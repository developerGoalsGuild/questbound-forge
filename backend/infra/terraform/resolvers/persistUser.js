import { util } from '@aws-appsync/utils';

// AppSync Function: builds payload to persist user profile via Lambda
export function request(ctx) {
  const args = ctx.args && ctx.args.input ? ctx.args.input : {};
  const identity = ctx.identity || {};
  const now = util.time.nowEpochMilliSeconds();
  const email = (args.email || '').trim().toLowerCase();
  const nickname = args.nickname || '';
  const birthDateStr = (args.birthDate || '').trim();
  const country = (args.country || '').trim();

  // Basic guards
  if (!email) util.error('email required', 'Validation');
  if (!nickname) util.error('nickname required', 'Validation');
  if (!country) util.error('country required', 'Validation');

  // Country allow-list (moved from Function 1)
  var allowedCountries = { US:1,CA:1,MX:1,BR:1,AR:1,CL:1,CO:1,PE:1,VE:1,UY:1,PY:1,BO:1,EC:1,GT:1,CR:1,PA:1,DO:1,CU:1,HN:1,NI:1,SV:1,JM:1,TT:1,
    GB:1,IE:1,FR:1,DE:1,ES:1,PT:1,IT:1,NL:1,BE:1,LU:1,CH:1,AT:1,DK:1,SE:1,NO:1,FI:1,IS:1,PL:1,CZ:1,SK:1,HU:1,RO:1,BG:1,GR:1,HR:1,SI:1,RS:1,BA:1,MK:1,AL:1,ME:1,UA:1,BY:1,LT:1,LV:1,EE:1,MD:1,TR:1,CY:1,MT:1,RU:1,
    CN:1,JP:1,KR:1,IN:1,PK:1,BD:1,LK:1,NP:1,BT:1,MV:1,TH:1,MY:1,SG:1,ID:1,PH:1,VN:1,KH:1,LA:1,MM:1,BN:1,TL:1,
    AE:1,SA:1,QA:1,BH:1,KW:1,OM:1,YE:1,IR:1,IQ:1,JO:1,LB:1,SY:1,IL:1,PS:1,AF:1,KZ:1,KG:1,UZ:1,TM:1,TJ:1,MN:1,
    AU:1,NZ:1,PG:1,FJ:1,SB:1,VU:1,WS:1,TO:1,TV:1,KI:1,FM:1,MH:1,NR:1,PW:1,
    EG:1,MA:1,DZ:1,TN:1,LY:1,SD:1,SS:1,ET:1,ER:1,DJ:1,SO:1,KE:1,UG:1,TZ:1,RW:1,BI:1,CD:1,CG:1,GA:1,GQ:1,CM:1,NG:1,GH:1,CI:1,SN:1,ML:1,BF:1,NE:1,BJ:1,TG:1,GM:1,GN:1,GW:1,SL:1,LR:1,MR:1,EH:1,AO:1,ZM:1,ZW:1,MW:1,MZ:1,NA:1,BW:1,SZ:1,LS:1,MG:1,MU:1,SC:1,CV:1,ST:1,KM:1 };
  if (!allowedCountries[country]) util.error('invalid country', 'Validation');

  // Birthdate checks (moved from Function 1)
  if (birthDateStr) {
    const parts = birthDateStr.split('-');
    if (parts.length !== 3) util.error('invalid birthDate format, expected YYYY-MM-DD', 'Validation');
    const y = (parts[0] - 0);
    const m = (parts[1] - 0);
    const d = (parts[2] - 0);
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      util.error('invalid birthDate', 'Validation');
    }
    var iso = util.time.nowISO8601();
    var cy = (iso.substring(0, 4) - 0);
    var cm = (iso.substring(5, 7) - 0);
    var cd = (iso.substring(8, 10) - 0);
    var cutoffY = cy - 1;
    if (y > cutoffY) util.error('birthDate too recent', 'Validation');
    if (y === cutoffY) {
      if (m > cm) util.error('birthDate too recent', 'Validation');
      if (m === cm && d > cd) util.error('birthDate too recent', 'Validation');
    }
  }

  const payload = {
    email,
    nickname,
    fullName: (args.fullName || '').trim(),
    birthDate: (birthDateStr || null),
    status: args.status || 'email confirmation pending',
    country: country,
    language: args.language || 'en',
    gender: args.gender || '',
    pronouns: args.pronouns || '',
    bio: args.bio || '',
    tags: Array.isArray(args.tags) ? args.tags : [],
    identitySub: identity.sub || null,
    now
  };

  return { operation: 'Invoke', payload };
}

export function response(ctx) {
  if (ctx.error) util.error(ctx.error.message, ctx.error.type);
  return ctx.result || { ok: true };
}
