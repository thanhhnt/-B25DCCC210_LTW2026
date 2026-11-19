import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CREDIT_OPTIONS, SEMESTERS, formatPoint } from './data';
import useFetch from './hooks/useFetch';
import coursesReducer from './coursesReducer';
import { calcStats, getGrade } from './utils';

const BUILD_TAG = "gp-4073";

const EMPTY_FORM = {
  code: '',
  name: '',
  credits: '3',
  semester: SEMESTERS[0],
  score: '',
};

const App = () => {
  const { data, loading, error } = useFetch("/data/courses.json");
  const [courses, dispatch] = useReducer(coursesReducer, []);
  const [semester, setSemester] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const codeRef = useRef(null);

  useEffect(() => {
    if (data) dispatch({ type: 'LOAD', payload: data });
  }, [data]);

  const visible = useMemo(
    () =>
      semester === 'all' ? courses : courses.filter((c) => c.semester === semester),
    [courses, semester]
  );
  const viewStats = useMemo(() => calcStats(visible), [visible]);
  const allStats = useMemo(() => calcStats(courses), [courses]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleScore = (id, e) => {
    const value = e.target.valueAsNumber;
    if (value >= 0 && value <= 10) {
      dispatch({ type: 'SET_SCORE', payload: { id, score: value } });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = form.code.trim();
    const name = form.name.trim();
    const scoreText = form.score.trim();
    const score = Number(scoreText);
    const next = {};

    if (code === '') {
      next.code = 'Hãy nhập mã môn';
    } else if (
      courses.some((c) => c.code.trim().toLowerCase() === code.toLowerCase())
    ) {
      next.code = 'Mã môn đã tồn tại';
    }
    if (name === '') next.name = 'Hãy nhập tên môn';
    if (scoreText === '' || Number.isNaN(score) || score < 0 || score > 10) {
      next.score = 'Điểm phải từ 0 đến 10';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    dispatch({
      type: 'ADD',
      payload: {
        code: code.toUpperCase(),
        name,
        credits: Number(form.credits),
        semester: form.semester,
        score,
      },
    });
    setForm(EMPTY_FORM);
    codeRef.current.focus();
  };

  return (
    <div className="app" data-build={BUILD_TAG}>
      <header>
        <h1>Sổ điểm sinh viên</h1>
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
                          <button
                            type="button"
                            onClick={() =>
                              dispatch({ type: 'REMOVE', payload: c.id })
                            }
                          >
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
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="code">Mã môn</label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  ref={codeRef}
                  value={form.code}
                  onChange={handleField}
                />
                {errors.code && (
                  <div role="alert" className="error">
                    {errors.code}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="name">Tên môn</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleField}
                />
                {errors.name && (
                  <div role="alert" className="error">
                    {errors.name}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="credits">Số tín chỉ</label>
                <select
                  id="credits"
                  name="credits"
                  value={form.credits}
                  onChange={handleField}
                >
                  {CREDIT_OPTIONS.map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="form-semester">Học kỳ</label>
                <select
                  id="form-semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleField}
                >
                  {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="score">Điểm hệ 10</label>
                <input
                  id="score"
                  name="score"
                  type="number"
                  step="0.1"
                  value={form.score}
                  onChange={handleField}
                />
                {errors.score && (
                  <div role="alert" className="error">
                    {errors.score}
                  </div>
                )}
              </div>

              <button type="submit">Thêm môn</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
};

export default App;