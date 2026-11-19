import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GRADES, SEMESTERS } from './data';
import useFetch from './hooks/useFetch';
import useLocalStorage from './hooks/useLocalStorage';
import useDebounce from './hooks/useDebounce';
import { useTheme } from './context/ThemeContext';
import { useNotice } from './context/NoticeContext';
import {
  removeCourse,
  selectCourses,
  setCourses,
  setScore,
} from './features/coursesSlice';
import { hasSaved } from './store';
import CourseRow from './components/CourseRow';
import AddCourseForm from './components/AddCourseForm';
import GoalPlanner from './components/GoalPlanner';
import { calcStats, getGrade } from './utils';

const BUILD_TAG = "gp-4073";

const normalize = (text) => text.normalize('NFC').toLowerCase().trim();

const App = () => {
  const { data, loading, error } = useFetch("/data/courses.json");
  const courses = useSelector(selectCourses);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const showNotice = useNotice();

  const [storedSemester, setSemester] = useLocalStorage('ltw_sodiem_semester', 'all');
  const semester =
    storedSemester === 'all' || SEMESTERS.includes(storedSemester)
      ? storedSemester
      : 'all';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef(null);

  // Chỉ nạp dữ liệu mẫu khi chưa có dữ liệu lưu
  useEffect(() => {
    if (!hasSaved && data) dispatch(setCourses(data));
  }, [data, dispatch]);

  // Phím tắt: "/" nhảy vào ô tìm kiếm, Esc xóa nội dung tìm kiếm
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const el = document.activeElement;
        const tag = el ? el.tagName : '';
        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA' ||
          (el && el.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const bySemester = useMemo(
    () =>
      semester === 'all' ? courses : courses.filter((c) => c.semester === semester),
    [courses, semester]
  );

  const visible = useMemo(() => {
    const q = normalize(debouncedSearch);
    if (q === '') return bySemester;
    return bySemester.filter(
      (c) => normalize(c.name).includes(q) || normalize(c.code).includes(q)
    );
  }, [bySemester, debouncedSearch]);

  // Thống kê không bị ảnh hưởng bởi ô tìm kiếm
  const viewStats = useMemo(() => calcStats(bySemester), [bySemester]);
  const allStats = useMemo(() => calcStats(courses), [courses]);

  const distribution = useMemo(() => {
    const counts = bySemester.reduce((acc, c) => {
      const letter = getGrade(c.score).letter;
      return { ...acc, [letter]: (acc[letter] || 0) + 1 };
    }, {});
    return GRADES.map((g) => ({ letter: g.letter, count: counts[g.letter] || 0 }));
  }, [bySemester]);

  useEffect(() => {
    document.title =
      courses.length > 0 ? `GPA ${allStats.gpa.toFixed(2)} – Sổ điểm` : 'Sổ điểm';
  }, [courses.length, allStats.gpa]);

  const handleCourseShift = (e) => {
    setSearch(e.target.value);
  };

  const handleScore = useCallback(
    (id, score) => {
      dispatch(setScore({ id, score }));
    },
    [dispatch]
  );

  const handleRemove = useCallback(
    (id, name) => {
      dispatch(removeCourse(id));
      showNotice(`Đã xóa môn ${name}`);
    },
    [dispatch, showNotice]
  );

  const handleReset = () => {
    if (!data) return;
    dispatch(setCourses(data));
    showNotice('Đã đặt lại dữ liệu mẫu');
  };

  const showLoading = !hasSaved && loading;
  const showError = !hasSaved && !loading && error;

  return (
    <div className={`app ${theme}`} data-build={BUILD_TAG}>
      <header>
        <h1>Sổ điểm sinh viên</h1>
        <button type="button" onClick={toggleTheme}>
          {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
        </button>
      </header>

      {showLoading && <p>Đang tải bảng điểm...</p>}
      {showError && <p>Không tải được bảng điểm</p>}

      {!showLoading && !showError && (
        <>
          <section>
            <h2>Thống kê</h2>
            <div className="stats">
              <p>{`Số môn: ${viewStats.count}`}</p>
              <p>{`Tổng tín chỉ: ${viewStats.credits}`}</p>
              <p>{`GPA (hệ 4): ${viewStats.gpa.toFixed(2)}`}</p>
              <p>{`Xếp loại: ${viewStats.rank}`}</p>
              <p>{`GPA tích lũy: ${allStats.gpa.toFixed(2)}`}</p>
            </div>

            <h3>Phân bố điểm chữ</h3>
            <ul className="distribution">
              {distribution.map((d) => (
                <li key={d.letter}>
                  {`${d.letter}: ${d.count}`}
                  <span className="bar" style={{ width: `${24 * d.count}px` }} />
                </li>
              ))}
            </ul>
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

            <div className="field">
              <label htmlFor="search">Tìm môn học</label>
              <input
                id="search"
                type="text"
                ref={searchRef}
                value={search}
                onChange={handleCourseShift}
              />
            </div>
            <p>{`Tìm thấy ${visible.length} môn`}</p>

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
                    <th>Số lần render</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c) => (
                    <CourseRow
                      key={c.id}
                      course={c}
                      onScore={handleScore}
                      onRemove={handleRemove}
                    />
                  ))}
                </tbody>
              </table>
            )}

            <p>
              <button type="button" onClick={handleReset} disabled={!data}>
                Đặt lại dữ liệu mẫu
              </button>
            </p>
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