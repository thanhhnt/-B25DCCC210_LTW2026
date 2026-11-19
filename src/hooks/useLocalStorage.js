import { useEffect, useState } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialValue : JSON.parse(raw);
    } catch (err) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // bỏ qua lỗi ghi (đầy bộ nhớ, chế độ riêng tư...)
    }
  }, [key, value]);

  return [value, setValue];
};

export default useLocalStorage;