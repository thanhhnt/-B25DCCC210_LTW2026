const COURSES_KEY = 'ltw_sodiem_courses';

// Trả về mảng đã lưu, hoặc null nếu chưa có / dữ liệu hỏng
export const loadSaved = () => {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

export const saveCourses = (courses) => {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  } catch (err) {
    // bỏ qua lỗi ghi
  }
};