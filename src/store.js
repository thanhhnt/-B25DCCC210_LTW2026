import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './features/coursesSlice';
import goalReducer from './features/goalSlice';
import { loadSaved, saveCourses } from './storage';

const saved = loadSaved();

// true nếu lần này đã có dữ liệu lưu trong localStorage
export const hasSaved = saved !== null;

const store = configureStore({
  reducer: {
    courses: coursesReducer,
    goal: goalReducer,
  },
  preloadedState: { courses: saved ?? [] },
});

// Chỉ lưu khi mảng môn học đổi tham chiếu
let previousCourses = store.getState().courses;
store.subscribe(() => {
  const current = store.getState().courses;
  if (current !== previousCourses) {
    previousCourses = current;
    saveCourses(current);
  }
});

export default store;