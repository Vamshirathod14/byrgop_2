import Stage from '../models/Stage.js';

// Stage data is a tiny, rarely-changed read-only config used on every question
// fetch and answer save. Caching it (short TTL) removes one MongoDB round trip
// per request; a stale label/color self-heals within the TTL.
const STAGE_MAP_TTL_MS = 30000;
let stageMapCache = { at: 0, value: null };

export async function getStageMap() {
  const now = Date.now();
  if (stageMapCache.value && now - stageMapCache.at < STAGE_MAP_TTL_MS) {
    return stageMapCache.value;
  }
  const stages = await Stage.find({ active: true }).sort({ sortOrder: 1 }).lean();
  const map = {};
  for (const s of stages) map[s.key] = { key: s.key, name: s.name, color: s.color };
  stageMapCache = { at: now, value: map };
  return map;
}

export async function resolveStage(stageKey) {
  if (!stageKey) return null;
  const map = await getStageMap();
  return map[stageKey] || null;
}
