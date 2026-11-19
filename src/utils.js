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