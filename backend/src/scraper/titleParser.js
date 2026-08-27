const {
  TEAM_MAP, POSITION_MAP, PREFIX_MODIFIER_MAP, MODIFIER_MAP, EDITION_MAP, COLOR_MAP,
  GRADE_SUFFIX_RE, SEASON_PREFIX_RE,
} = require('./config');

// Busca la primera clave de `map` que aparezca en `text`, la remueve (primera ocurrencia) y
// devuelve { text, value } — value es el mapeo en español, o null si no apareció ninguna.
function extractFirst(text, map) {
  for (const [cn, es] of Object.entries(map)) {
    const i = text.indexOf(cn);
    if (i !== -1) {
      return { text: text.slice(0, i) + text.slice(i + cn.length), value: es };
    }
  }
  return { text, value: null };
}

// Convierte un título crudo en chino (ej. "长袖：2001赛季阿根廷主场马拉多纳纪念版8A") en los
// campos que necesita el catálogo. Nunca lanza — vocabulario no mapeado queda como texto suelto
// en el nombre + un warning, para revisar manualmente sin romper el scraper.
function parseTitle(rawTitle) {
  const warnings = [];
  let text = rawTitle.trim().replace(GRADE_SUFFIX_RE, '').trim();

  const prefixModifiers = [];
  for (const [cn, es] of Object.entries(PREFIX_MODIFIER_MAP)) {
    if (text.startsWith(cn)) {
      text = text.slice(cn.length).replace(/^[：:]\s*/, '');
      prefixModifiers.push(es);
    }
  }

  const seasonMatch = text.match(SEASON_PREFIX_RE);
  const season = seasonMatch?.[1] || null;
  if (seasonMatch) text = text.slice(seasonMatch[0].length);

  let club = null;
  ({ text, value: club } = extractFirst(text, TEAM_MAP));

  let position = null;
  ({ text, value: position } = extractFirst(text, POSITION_MAP));

  const modifiers = [];
  let mod = null;
  ({ text, value: mod } = extractFirst(text, MODIFIER_MAP));
  if (mod) modifiers.push(mod);

  let color = null;
  ({ text, value: color } = extractFirst(text, COLOR_MAP));
  if (color) modifiers.push(color);

  let edition = null;
  ({ text, value: edition } = extractFirst(text, EDITION_MAP));

  const leftover = text.trim();
  if (leftover) warnings.push(`Texto sin mapear en "${rawTitle}": "${leftover}"`);
  if (!club) warnings.push(`No se identificó club en "${rawTitle}"`);
  if (!season) warnings.push(`No se identificó temporada en "${rawTitle}"`);

  const versionParts = [position, ...modifiers, ...prefixModifiers].filter(Boolean);
  const version = versionParts.length ? versionParts.join(' ') : null;

  const nameParts = [
    club || 'Selección Argentina',
    season,
    versionParts.length ? `- ${versionParts.join(' ')}` : null,
    edition ? `(${edition})` : null,
    leftover ? `(${leftover})` : null,
  ].filter(Boolean);

  return {
    name: nameParts.join(' '),
    club,
    version,
    season,
    warnings,
  };
}

module.exports = { parseTitle };
