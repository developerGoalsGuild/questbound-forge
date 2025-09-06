// Country utilities with localization support
import { Language } from '@/i18n/translations';

export type Country = { code: string; name: string };

// Base list of ISO 3166-1 alpha-2 codes we support
const codes: string[] = [
  'US','CA','MX','BR','AR','CL','CO','PE','VE','UY','PY','BO','EC','GT','CR','PA','DO','CU','HN','NI','SV','JM','TT',
  'GB','IE','FR','DE','ES','PT','IT','NL','BE','LU','CH','AT','DK','SE','NO','FI','IS','PL','CZ','SK','HU','RO','BG','GR','HR','SI','RS','BA','MK','AL','ME','UA','BY','LT','LV','EE','MD','TR','CY','MT','RU',
  'CN','JP','KR','IN','PK','BD','LK','NP','BT','MV','TH','MY','SG','ID','PH','VN','KH','LA','MM','BN','TL',
  'AE','SA','QA','BH','KW','OM','YE','IR','IQ','JO','LB','SY','IL','PS','AF','KZ','KG','UZ','TM','TJ','MN',
  'AU','NZ','PG','FJ','SB','VU','WS','TO','TV','KI','FM','MH','NR','PW',
  'EG','MA','DZ','TN','LY','SD','SS','ET','ER','DJ','SO','KE','UG','TZ','RW','BI','CD','CG','GA','GQ','CM','NG','GH','CI','SN','ML','BF','NE','BJ','TG','GM','GN','GW','SL','LR','MR','EH','AO','ZM','ZW','MW','MZ','NA','BW','SZ','LS','MG','MU','SC','CV','ST','KM',
];

// Localized country names per language
const NAMES_EN: Record<string, string> = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Peru', VE: 'Venezuela', UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivia', EC: 'Ecuador', GT: 'Guatemala', CR: 'Costa Rica', PA: 'Panama', DO: 'Dominican Republic', CU: 'Cuba', HN: 'Honduras', NI: 'Nicaragua', SV: 'El Salvador', JM: 'Jamaica', TT: 'Trinidad and Tobago',
  GB: 'United Kingdom', IE: 'Ireland', FR: 'France', DE: 'Germany', ES: 'Spain', PT: 'Portugal', IT: 'Italy', NL: 'Netherlands', BE: 'Belgium', LU: 'Luxembourg', CH: 'Switzerland', AT: 'Austria', DK: 'Denmark', SE: 'Sweden', NO: 'Norway', FI: 'Finland', IS: 'Iceland', PL: 'Poland', CZ: 'Czech Republic', SK: 'Slovakia', HU: 'Hungary', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', HR: 'Croatia', SI: 'Slovenia', RS: 'Serbia', BA: 'Bosnia and Herzegovina', MK: 'North Macedonia', AL: 'Albania', ME: 'Montenegro', UA: 'Ukraine', BY: 'Belarus', LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', MD: 'Moldova', TR: 'Türkiye', CY: 'Cyprus', MT: 'Malta', RU: 'Russia',
  CN: 'China', JP: 'Japan', KR: 'South Korea', IN: 'India', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Nepal', BT: 'Bhutan', MV: 'Maldives', TH: 'Thailand', MY: 'Malaysia', SG: 'Singapore', ID: 'Indonesia', PH: 'Philippines', VN: 'Vietnam', KH: 'Cambodia', LA: 'Laos', MM: 'Myanmar', BN: 'Brunei', TL: 'Timor-Leste',
  AE: 'United Arab Emirates', SA: 'Saudi Arabia', QA: 'Qatar', BH: 'Bahrain', KW: 'Kuwait', OM: 'Oman', YE: 'Yemen', IR: 'Iran', IQ: 'Iraq', JO: 'Jordan', LB: 'Lebanon', SY: 'Syria', IL: 'Israel', PS: 'Palestine', AF: 'Afghanistan', KZ: 'Kazakhstan', KG: 'Kyrgyzstan', UZ: 'Uzbekistan', TM: 'Turkmenistan', TJ: 'Tajikistan', MN: 'Mongolia',
  AU: 'Australia', NZ: 'New Zealand', PG: 'Papua New Guinea', FJ: 'Fiji', SB: 'Solomon Islands', VU: 'Vanuatu', WS: 'Samoa', TO: 'Tonga', TV: 'Tuvalu', KI: 'Kiribati', FM: 'Micronesia', MH: 'Marshall Islands', NR: 'Nauru', PW: 'Palau',
  EG: 'Egypt', MA: 'Morocco', DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya', SD: 'Sudan', SS: 'South Sudan', ET: 'Ethiopia', ER: 'Eritrea', DJ: 'Djibouti', SO: 'Somalia', KE: 'Kenya', UG: 'Uganda', TZ: 'Tanzania', RW: 'Rwanda', BI: 'Burundi', CD: 'Congo (DRC)', CG: 'Congo (Republic)', GA: 'Gabon', GQ: 'Equatorial Guinea', CM: 'Cameroon', NG: 'Nigeria', GH: 'Ghana', CI: "Côte d'Ivoire", SN: 'Senegal', ML: 'Mali', BF: 'Burkina Faso', NE: 'Niger', BJ: 'Benin', TG: 'Togo', GM: 'Gambia', GN: 'Guinea', GW: 'Guinea-Bissau', SL: 'Sierra Leone', LR: 'Liberia', MR: 'Mauritania', EH: 'Western Sahara', AO: 'Angola', ZM: 'Zambia', ZW: 'Zimbabwe', MW: 'Malawi', MZ: 'Mozambique', NA: 'Namibia', BW: 'Botswana', SZ: 'Eswatini', LS: 'Lesotho', MG: 'Madagascar', MU: 'Mauritius', SC: 'Seychelles', CV: 'Cabo Verde', ST: 'Sao Tome and Principe', KM: 'Comoros',
};

const NAMES_ES: Record<string, string> = {
  US: 'Estados Unidos', CA: 'Canadá', MX: 'México', BR: 'Brasil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia', PE: 'Perú', VE: 'Venezuela', UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivia', EC: 'Ecuador', GT: 'Guatemala', CR: 'Costa Rica', PA: 'Panamá', DO: 'República Dominicana', CU: 'Cuba', HN: 'Honduras', NI: 'Nicaragua', SV: 'El Salvador', JM: 'Jamaica', TT: 'Trinidad y Tobago',
  GB: 'Reino Unido', IE: 'Irlanda', FR: 'Francia', DE: 'Alemania', ES: 'España', PT: 'Portugal', IT: 'Italia', NL: 'Países Bajos', BE: 'Bélgica', LU: 'Luxemburgo', CH: 'Suiza', AT: 'Austria', DK: 'Dinamarca', SE: 'Suecia', NO: 'Noruega', FI: 'Finlandia', IS: 'Islandia', PL: 'Polonia', CZ: 'Chequia', SK: 'Eslovaquia', HU: 'Hungría', RO: 'Rumanía', BG: 'Bulgaria', GR: 'Grecia', HR: 'Croacia', SI: 'Eslovenia', RS: 'Serbia', BA: 'Bosnia y Herzegovina', MK: 'Macedonia del Norte', AL: 'Albania', ME: 'Montenegro', UA: 'Ucrania', BY: 'Bielorrusia', LT: 'Lituania', LV: 'Letonia', EE: 'Estonia', MD: 'Moldavia', TR: 'Turquía', CY: 'Chipre', MT: 'Malta', RU: 'Rusia',
  CN: 'China', JP: 'Japón', KR: 'Corea del Sur', IN: 'India', PK: 'Pakistán', BD: 'Bangladés', LK: 'Sri Lanka', NP: 'Nepal', BT: 'Bután', MV: 'Maldivas', TH: 'Tailandia', MY: 'Malasia', SG: 'Singapur', ID: 'Indonesia', PH: 'Filipinas', VN: 'Vietnam', KH: 'Camboya', LA: 'Laos', MM: 'Myanmar', BN: 'Brunéi', TL: 'Timor Oriental',
  AE: 'Emiratos Árabes Unidos', SA: 'Arabia Saudita', QA: 'Catar', BH: 'Baréin', KW: 'Kuwait', OM: 'Omán', YE: 'Yemen', IR: 'Irán', IQ: 'Irak', JO: 'Jordania', LB: 'Líbano', SY: 'Siria', IL: 'Israel', PS: 'Palestina', AF: 'Afganistán', KZ: 'Kazajistán', KG: 'Kirguistán', UZ: 'Uzbekistán', TM: 'Turkmenistán', TJ: 'Tayikistán', MN: 'Mongolia',
  AU: 'Australia', NZ: 'Nueva Zelanda', PG: 'Papúa Nueva Guinea', FJ: 'Fiyi', SB: 'Islas Salomón', VU: 'Vanuatu', WS: 'Samoa', TO: 'Tonga', TV: 'Tuvalu', KI: 'Kiribati', FM: 'Micronesia', MH: 'Islas Marshall', NR: 'Nauru', PW: 'Palaos',
  EG: 'Egipto', MA: 'Marruecos', DZ: 'Argelia', TN: 'Túnez', LY: 'Libia', SD: 'Sudán', SS: 'Sudán del Sur', ET: 'Etiopía', ER: 'Eritrea', DJ: 'Yibuti', SO: 'Somalia', KE: 'Kenia', UG: 'Uganda', TZ: 'Tanzania', RW: 'Ruanda', BI: 'Burundi', CD: 'Congo (RDC)', CG: 'Congo (Rep.)', GA: 'Gabón', GQ: 'Guinea Ecuatorial', CM: 'Camerún', NG: 'Nigeria', GH: 'Ghana', CI: 'Costa de Marfil', SN: 'Senegal', ML: 'Malí', BF: 'Burkina Faso', NE: 'Níger', BJ: 'Benín', TG: 'Togo', GM: 'Gambia', GN: 'Guinea', GW: 'Guinea-Bisáu', SL: 'Sierra Leona', LR: 'Liberia', MR: 'Mauritania', EH: 'Sáhara Occidental', AO: 'Angola', ZM: 'Zambia', ZW: 'Zimbabue', MW: 'Malaui', MZ: 'Mozambique', NA: 'Namibia', BW: 'Botsuana', SZ: 'Esuatini', LS: 'Lesoto', MG: 'Madagascar', MU: 'Mauricio', SC: 'Seychelles', CV: 'Cabo Verde', ST: 'Santo Tomé y Príncipe', KM: 'Comoras',
};

const NAMES_FR: Record<string, string> = {
  US: 'États-Unis', CA: 'Canada', MX: 'Mexique', BR: 'Brésil', AR: 'Argentine', CL: 'Chili', CO: 'Colombie', PE: 'Pérou', VE: 'Venezuela', UY: 'Uruguay', PY: 'Paraguay', BO: 'Bolivie', EC: 'Équateur', GT: 'Guatemala', CR: 'Costa Rica', PA: 'Panama', DO: 'République dominicaine', CU: 'Cuba', HN: 'Honduras', NI: 'Nicaragua', SV: 'Salvador', JM: 'Jamaïque', TT: 'Trinité-et-Tobago',
  GB: 'Royaume-Uni', IE: 'Irlande', FR: 'France', DE: 'Allemagne', ES: 'Espagne', PT: 'Portugal', IT: 'Italie', NL: 'Pays-Bas', BE: 'Belgique', LU: 'Luxembourg', CH: 'Suisse', AT: 'Autriche', DK: 'Danemark', SE: 'Suède', NO: 'Norvège', FI: 'Finlande', IS: 'Islande', PL: 'Pologne', CZ: 'Tchéquie', SK: 'Slovaquie', HU: 'Hongrie', RO: 'Roumanie', BG: 'Bulgarie', GR: 'Grèce', HR: 'Croatie', SI: 'Slovénie', RS: 'Serbie', BA: 'Bosnie-Herzégovine', MK: 'Macédoine du Nord', AL: 'Albanie', ME: 'Monténégro', UA: 'Ukraine', BY: 'Biélorussie', LT: 'Lituanie', LV: 'Lettonie', EE: 'Estonie', MD: 'Moldavie', TR: 'Türkiye', CY: 'Chypre', MT: 'Malte', RU: 'Russie',
  CN: 'Chine', JP: 'Japon', KR: 'Corée du Sud', IN: 'Inde', PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Népal', BT: 'Bhoutan', MV: 'Maldives', TH: 'Thaïlande', MY: 'Malaisie', SG: 'Singapour', ID: 'Indonésie', PH: 'Philippines', VN: 'Viêt Nam', KH: 'Cambodge', LA: 'Laos', MM: 'Myanmar', BN: 'Brunei', TL: 'Timor oriental',
  AE: 'Émirats arabes unis', SA: 'Arabie saoudite', QA: 'Qatar', BH: 'Bahreïn', KW: 'Koweït', OM: 'Oman', YE: 'Yémen', IR: 'Iran', IQ: 'Irak', JO: 'Jordanie', LB: 'Liban', SY: 'Syrie', IL: 'Israël', PS: 'Palestine', AF: 'Afghanistan', KZ: 'Kazakhstan', KG: 'Kirghizistan', UZ: 'Ouzbékistan', TM: 'Turkménistan', TJ: 'Tadjikistan', MN: 'Mongolie',
  AU: 'Australie', NZ: 'Nouvelle-Zélande', PG: 'Papouasie-Nouvelle-Guinée', FJ: 'Fidji', SB: 'Îles Salomon', VU: 'Vanuatu', WS: 'Samoa', TO: 'Tonga', TV: 'Tuvalu', KI: 'Kiribati', FM: 'Micronésie', MH: 'Îles Marshall', NR: 'Nauru', PW: 'Palaos',
  EG: 'Égypte', MA: 'Maroc', DZ: 'Algérie', TN: 'Tunisie', LY: 'Libye', SD: 'Soudan', SS: 'Soudan du Sud', ET: 'Éthiopie', ER: 'Érythrée', DJ: 'Djibouti', SO: 'Somalie', KE: 'Kenya', UG: 'Ouganda', TZ: 'Tanzanie', RW: 'Rwanda', BI: 'Burundi', CD: 'Congo (RDC)', CG: 'Congo (République)', GA: 'Gabon', GQ: 'Guinée équatoriale', CM: 'Cameroun', NG: 'Nigéria', GH: 'Ghana', CI: "Côte d'Ivoire", SN: 'Sénégal', ML: 'Mali', BF: 'Burkina Faso', NE: 'Niger', BJ: 'Bénin', TG: 'Togo', GM: 'Gambie', GN: 'Guinée', GW: 'Guinée-Bissau', SL: 'Sierra Leone', LR: 'Libéria', MR: 'Mauritanie', EH: 'Sahara occidental', AO: 'Angola', ZM: 'Zambie', ZW: 'Zimbabwe', MW: 'Malawi', MZ: 'Mozambique', NA: 'Namibie', BW: 'Botswana', SZ: 'Eswatini', LS: 'Lesotho', MG: 'Madagascar', MU: 'Maurice', SC: 'Seychelles', CV: 'Cap-Vert', ST: 'Sao Tomé-et-Principe', KM: 'Comores',
};

const NAMES_BY_LANG: Record<Language, Record<string, string>> = {
  en: NAMES_EN,
  es: NAMES_ES,
  fr: NAMES_FR,
};

export function getCountries(language: Language): Country[] {
  const names = NAMES_BY_LANG[language] || NAMES_EN;
  return codes.map((code) => ({ code, name: names[code] || NAMES_EN[code] || code }));
}

export function isValidCountryCode(code: string): boolean {
  return codes.includes(code);
}

export function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

