/* Pure optional learning-plan and spaced-review data. No DOM, storage or network. */
(function (root) {
  'use strict';
  const DAY = 24 * 60 * 60 * 1000;
  const MAX_AT = 9999999999999;
  const INTERVALS = [1, 3, 7, 14, 14];
  const MISSIONS = ['recall', 'discover', 'connect', 'apply'];
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const timestamp = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_AT ? Math.floor(value) : 0;
  const stage = value => Number.isInteger(value) && value >= 0 && value <= 4 ? value : 0;
  const nextAt = (at, days) => Math.min(MAX_AT, at + days * DAY);
  const text = value => typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, 240) : '';

  function dayKey(now = Date.now()) {
    const date = new Date(timestamp(now));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function validDay(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    const [year, month, date] = key.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, date));
    return year >= 1970 && year <= 2286 && parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === date;
  }
  function cleanDay(value) {
    return {missions: MISSIONS.filter(mission => Array.isArray(value?.missions) && value.missions.includes(mission)), reflection: text(value?.reflection)};
  }
  function cleanLearning(value) {
    const learning = {goal: [15, 30, 60].includes(value?.goal) ? value.goal : 60, days: Object.create(null)};
    if (object(value?.days)) {
      for (const key of Object.keys(value.days).filter(validDay).sort().slice(-31)) {
        if (object(value.days[key])) learning.days[key] = cleanDay(value.days[key]);
      }
    }
    return learning;
  }
  function cleanReview(raw, record) {
    const hasSchedule = object(raw) && own(raw, 'nextReviewAt');
    const lastAt = timestamp(record?.lastAt);
    const nextReviewAt = hasSchedule ? timestamp(raw.nextReviewAt) : lastAt > 0 ? nextAt(lastAt, 1) : 0;
    const lastSpacedAt = timestamp(raw?.lastSpacedAt);
    const reviewStage = stage(raw?.reviewStage);
    // A migrated or inconsistent record cannot claim previously verified spacing.
    const evidence = hasSchedule && nextReviewAt > 0 && lastSpacedAt > 0 && lastSpacedAt <= lastAt && reviewStage > 0 && record?.wrong !== true;
    return {reviewStage: evidence ? reviewStage : 0, nextReviewAt, lastSpacedAt: evidence ? lastSpacedAt : 0};
  }
  function validateExtras(raw, validated) {
    if (!Array.isArray(validated?.profiles)) return validated;
    validated.profiles.forEach((profile, index) => {
      const source = Array.isArray(raw?.profiles) && object(raw.profiles[index]) ? raw.profiles[index] : null;
      profile.learning = cleanLearning(source?.learning);
      if (object(profile.records)) {
        for (const [id, record] of Object.entries(profile.records)) {
          if (object(record)) Object.assign(record, cleanReview(own(source?.records, id) ? source.records[id] : null, record));
        }
      }
    });
    return validated;
  }
  function due(record, now = Date.now()) {
    const time = timestamp(now), next = timestamp(record?.nextReviewAt);
    return next > 0 && next <= time;
  }
  function record(profile, question, correct, at = Date.now(), previousRecord) {
    const time = timestamp(at), id = question?.id;
    if (!object(profile?.records) || typeof id !== 'string' || !own(profile.records, id) || !object(profile.records[id]) || time === 0) return;
    const current = profile.records[id];
    const previous = object(previousRecord) ? previousRecord : null;
    const previousSchedule = previous ? cleanReview(previous, previous) : {reviewStage: 0, nextReviewAt: 0, lastSpacedAt: 0};
    if (correct !== true) {
      Object.assign(current, {reviewStage: 0, nextReviewAt: nextAt(time, 1), lastSpacedAt: 0});
      return;
    }
    const previouslyCorrect = previous?.earned === true || (typeof previous?.right === 'number' && previous.right > 0);
    if (!previous || !previouslyCorrect || previousSchedule.nextReviewAt === 0 || previous.wrong === true) {
      Object.assign(current, {reviewStage: 0, nextReviewAt: nextAt(time, 1), lastSpacedAt: 0});
      return;
    }
    if (due(previousSchedule, time) && time - timestamp(previous.lastAt) >= DAY) {
      const reviewStage = Math.min(4, previousSchedule.reviewStage + 1);
      Object.assign(current, {reviewStage, nextReviewAt: nextAt(time, INTERVALS[reviewStage]), lastSpacedAt: time});
    } else {
      // Early repeats do not advance or postpone the schedule. If already due,
      // a recent exposure requires a fresh full-day gap before spacing is credited.
      Object.assign(current, previousSchedule);
      if (due(previousSchedule, time)) current.nextReviewAt = nextAt(time, 1);
    }
  }
  function counts(profile, courseKey, now = Date.now()) {
    const result = {due: 0, spaced: 0};
    if (!object(profile?.records)) return result;
    for (const value of Object.values(profile.records)) {
      if (!object(value) || (courseKey !== undefined && value.course !== courseKey)) continue;
      if (due(value, now)) result.due++;
      if (cleanReview(value, value).reviewStage > 0) result.spaced++;
    }
    return result;
  }
  function day(profile, now = Date.now()) {
    if (!object(profile)) throw new TypeError('A learning profile is required');
    profile.learning = cleanLearning(profile.learning);
    const key = dayKey(now);
    if (!own(profile.learning.days, key)) profile.learning.days[key] = cleanDay(null);
    const keys = Object.keys(profile.learning.days).sort();
    // Keep today's editable entry even when a malformed future date was imported.
    for (const old of keys.filter(value => value !== key).slice(0, Math.max(0, keys.length - 31))) delete profile.learning.days[old];
    return profile.learning.days[key];
  }
  const api = {DAY, MISSIONS: Object.freeze(MISSIONS.slice()), validateExtras, record, due, counts, day};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WQLearning = api;
})(typeof window !== 'undefined' ? window : globalThis);
