/**
 * 날짜 및 주차 계산 유틸리티
 */

/**
 * 월 기준 주차 계산 (해당 월의 몇 번째 주인지)
 * @param {Date} date - 계산할 날짜
 * @returns {Object} { year, month, week } - 연도, 월, 주차
 */
export const getWeekOfMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-based to 1-based

  // 해당 월의 첫 번째 날
  const firstDayOfMonth = new Date(year, date.getMonth(), 1);

  // 첫 번째 날의 요일 (0: 일요일)
  const firstDayWeekday = firstDayOfMonth.getDay();

  // 현재 날짜까지의 일수
  const dayOfMonth = date.getDate();

  // 주차 계산 (일요일 시작 기준)
  const adjustedDay = dayOfMonth + firstDayWeekday;
  const week = Math.ceil(adjustedDay / 7);

  return { year, month, week };
};

/**
 * ISO 8601 기준 주차 계산 (1년 중 몇 번째 주인지)
 * @param {Date} date - 계산할 날짜
 * @returns {number} ISO 주차 (1-53)
 */
export const getISOWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

/**
 * 주차 레이블 포맷팅 (예: "2024년 3월 2주차")
 * @param {Date} date - 포맷할 날짜
 * @returns {string} 포맷된 주차 레이블
 */
export const formatWeekLabel = (date) => {
  const { year, month, week } = getWeekOfMonth(date);
  return `${year}년 ${month}월 ${week}주차`;
};

/**
 * 짧은 주차 레이블 포맷팅 (예: "3월 2주차")
 * @param {Date} date - 포맷할 날짜
 * @returns {string} 포맷된 주차 레이블
 */
export const formatShortWeekLabel = (date) => {
  const { month, week } = getWeekOfMonth(date);
  return `${month}월 ${week}주차`;
};

/**
 * 날짜를 YY년 M월 W주차 형식으로 포맷팅 (예: "24년 3월 2주차")
 * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 문자열
 */
export const convertToWeekFormat = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getFullYear().toString().slice(-2);
  const { month, week } = getWeekOfMonth(date);
  return `${year}년 ${month}월 ${week}주차`;
};

/**
 * 날짜 범위의 모든 주차 가져오기
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 * @returns {Array} 주차 배열 [{ year, month, week, startDate, endDate }, ...]
 */
export const getWeeksInRange = (startDate, endDate) => {
  const weeks = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const { year, month, week } = getWeekOfMonth(current);

    // 해당 주의 시작일 (일요일)
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - current.getDay());

    // 해당 주의 종료일 (토요일)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    weeks.push({
      year,
      month,
      week,
      label: formatWeekLabel(current),
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd),
    });

    // 다음 주로 이동 (7일 추가)
    current.setDate(current.getDate() + 7);
  }

  return weeks;
};

/**
 * 날짜 문자열을 Date 객체로 안전하게 파싱
 * @param {string|Date} dateInput - 파싱할 날짜
 * @returns {Date|null} Date 객체 또는 null
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * 두 주차가 같은지 비교
 * @param {Date} date1 - 첫 번째 날짜
 * @param {Date} date2 - 두 번째 날짜
 * @returns {boolean} 같은 주차인지 여부
 */
export const isSameWeek = (date1, date2) => {
  const week1 = getWeekOfMonth(date1);
  const week2 = getWeekOfMonth(date2);

  return (
    week1.year === week2.year &&
    week1.month === week2.month &&
    week1.week === week2.week
  );
};

/**
 * 주차별로 데이터 그룹화
 * @param {Array} data - 그룹화할 데이터 배열
 * @param {Function} dateExtractor - 날짜를 추출하는 함수
 * @returns {Object} 주차별로 그룹화된 데이터
 */
export const groupByWeek = (data, dateExtractor) => {
  const grouped = {};

  data.forEach((item) => {
    const date = parseDate(dateExtractor(item));
    if (!date) return;

    const weekLabel = formatWeekLabel(date);

    if (!grouped[weekLabel]) {
      grouped[weekLabel] = {
        label: weekLabel,
        date: date,
        items: [],
      };
    }

    grouped[weekLabel].items.push(item);
  });

  return grouped;
};

/**
 * 현재 주차 정보 가져오기
 * @returns {Object} 현재 주차 정보
 */
export const getCurrentWeek = () => {
  const now = new Date();
  const { year, month, week } = getWeekOfMonth(now);
  return {
    year,
    month,
    week,
    label: formatWeekLabel(now),
    date: now,
  };
};
