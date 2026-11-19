import { GRADES, RANKS } from './data';

// Trả về mục đầu tiên của GRADES có score >= min
export const getGrade = (score) => GRADES.find((g) => score >= g.min);

// Trả về tên xếp loại theo GPA hệ 4
export const getRank = (gpa) => RANKS.find((r) => gpa >= r.min).title;

export const calcStats = (courses) => {
  const count = courses.length;
  const credits = courses.reduce((sum, c) => sum + c.credits, 0);
  const points = courses.reduce(
    (sum, c) => sum + c.credits * getGrade(c.score).point,
    0
  );
  const gpa = credits === 0 ? 0 : Math.round((points / credits) * 100) / 100;
  const rank = credits === 0 ? 'Chưa xếp loại' : getRank(gpa);
  return { count, credits, points, gpa, rank };
};
export const calcRequired = (courses, target, remaining) => {
  const invalid = 'Hãy nhập GPA mục tiêu (0–4) và số tín chỉ còn lại (từ 1)';
  const t = String(target).trim() === '' ? NaN : Number(target);
  const r = String(remaining).trim() === '' ? NaN : Number(remaining);

  if (!Number.isFinite(t) || t < 0 || t > 4 || !Number.isInteger(r) || r < 1) {
    return invalid;
  }

  const { credits, points } = calcStats(courses);
  const need = (t * (credits + r) - points) / r;

  if (need > 4) return 'Không thể đạt mục tiêu này';
  if (need <= 0) return 'Bạn đã đạt mục tiêu';
  return `Cần đạt trung bình ${need.toFixed(2)} điểm (hệ 4) ở ${r} tín chỉ còn lại`;
};