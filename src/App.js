import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SEMESTERS, formatPoint } from './data';
import useFetch from './hooks/useFetch';
import { useTheme } from './context/ThemeContext';
import { useNotice } from './context/NoticeContext';
import {
  removeCourse,
  selectCourses,
  setCourses,
  setScore,
} from './features/coursesSlice';
import AddCourseForm from './components/AddCourseForm';
import GoalPlanner from './components/GoalPlanner';
import { calcStats, getGrade } from './utils';

const BUILD_TAG = "gp-4073";

const App = () => {
  const { data, loading, error } = useFetch("/data/courses.json");
  const courses = useSelector(selectCourses);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const showNotice = useNotice();
  const [semester, setSemester] = useState('all');

  useEffect(() => {
    if (data) dispatch(setCourses(data));
  }, [data, dispatch]);

  const visible = useMemo(
    () =>
      semester === 'all' ? courses : courses.filter((c) => c.semester === semester),
    [courses, semester]
  );
  const viewStats = useMemo(() => calcStats(visible), [visible]);
  const allStats = useMemo(() => calcStats(courses), [courses]);

  const handleScore = (id, e) => {
    const value = e.target.valueAsNumber;
    if (value >= 0 && value <= 10) {
      dispatch(setScore({ id, score: value }));
    }
  };

  const handleRemove = (course) => {
    dispatch(removeCourse(course.id));
    showNotice(`Đã xóa môn ${course.name}`);
  };

  return (
    <div className={`app ${theme}`} data-build={BUILD_TAG}>
      <header>
        <h1>Sổ điểm sinh viên</h1>
        <button type="button" onClick={toggleTheme}>
          {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
        </button>
      </header>

      {loading && <p>Đang tải bảng điểm...</p>}
      {error && <p>Không tải được bảng điểm</p>}

      {!loading && !error && (
        <>
          <section>
            <h2>Thống kê</h2>
            <p>{`Số môn: ${viewStats.count}`}</p>
            <p>{`Tổng tín chỉ: ${viewStats.credits}`}</p>
            <p>{`GPA (hệ 4): ${viewStats.gpa.toFixed(2)}`}</p>
            <p>{`Xếp loại: ${viewStats.rank}`}</p>
            <p>{`GPA tích lũy: ${allStats.gpa.toFixed(2)}`}</p>
          </section>

          <section>
            <h2>Bảng điểm</h2>
            <div className="field">
              <label htmlFor="semester">Xem học kỳ</label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <p>Chưa có môn học nào</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên môn</th>
                    <th>Tín chỉ</th>
                    <th>Học kỳ</th>
                    <th>Điểm (hệ 10)</th>
                    <th>Điểm chữ</th>
                    <th>Điểm (hệ 4)</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => {
                    const grade = getGrade(c.score);
                    const failed = grade.letter === 'F';
                    return (
                      <tr
                        key={c.id}
                        className={failed ? 'fail' : ''}
                        style={failed ? { color: '#c62828' } : undefined}
                      >
                        <td>{c.code}</td>
                        <td>{c.name}</td>
                        <td>{c.credits}</td>
                        <td>{c.semester}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            aria-label={`Điểm ${c.name}`}
                            value={c.score}
                            onChange={(e) => handleScore(c.id, e)}
                          />
                        </td>
                        <td>{failed ? 'F – Học lại' : grade.letter}</td>
                        <td>{formatPoint(grade.point)}</td>
                        <td>
                          <button type="button" onClick={() => handleRemove(c)}>
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Thêm môn học</h2>
            <AddCourseForm />
          </section>

          <section>
            <h2>Mục tiêu GPA</h2>
            <GoalPlanner />
          </section>
        </>
      )}
    </div>
  );
};

export default App;