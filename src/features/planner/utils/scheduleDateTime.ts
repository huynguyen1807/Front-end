import { mealTypeOptions } from "../constants/plannerConstants";
import { MealPlan, MealType } from "../types/planner";
import {
  addDays,
  parseDateInput,
  startOfWeekMonday,
  toDateInput,
} from "./plannerUtils";

type ScheduledMealType = Exclude<MealType, "SNACK">;

const SLOT_RANGES: Array<{
  mealType: ScheduledMealType;
  startMinute: number;
  endMinute: number;
}> = [
  { mealType: "BREAKFAST", startMinute: 4 * 60, endMinute: 10 * 60 + 59 },
  { mealType: "LUNCH", startMinute: 11 * 60, endMinute: 13 * 60 + 59 },
  { mealType: "AFTERNOON", startMinute: 14 * 60, endMinute: 17 * 60 + 59 },
  { mealType: "DINNER", startMinute: 18 * 60, endMinute: 22 * 60 + 59 },
  { mealType: "LATE_NIGHT", startMinute: 23 * 60, endMinute: 3 * 60 + 59 },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ScheduleDateGroup = {
  key: "current" | "next";
  label: string;
  dates: Array<{
    value: string;
    weekday: string;
    dayMonth: string;
    disabled: boolean;
  }>;
};

export function isValidScheduleDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);
  return candidate.getFullYear() === year
    && candidate.getMonth() === month - 1
    && candidate.getDate() === day;
}

export function getMinutesFromTime(value: string) {
  if (!TIME_PATTERN.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function getMealTypeForTime(value: string): ScheduledMealType {
  const minuteOfDay = getMinutesFromTime(value);
  if (minuteOfDay === null) return "BREAKFAST";

  return SLOT_RANGES.find((slot) => {
    if (slot.startMinute <= slot.endMinute) {
      return minuteOfDay >= slot.startMinute && minuteOfDay <= slot.endMinute;
    }
    return minuteOfDay >= slot.startMinute || minuteOfDay <= slot.endMinute;
  })?.mealType || "LATE_NIGHT";
}

export function isNextDayLateNightTime(value: string) {
  const minuteOfDay = getMinutesFromTime(value);
  return minuteOfDay !== null && minuteOfDay <= 3 * 60 + 59;
}

export function getNextScheduleDate(dateKey: string) {
  if (!isValidScheduleDate(dateKey)) return null;
  return toDateInput(addDays(parseDateInput(dateKey), 1));
}

function isMinuteInSlot(minuteOfDay: number, mealType: MealType) {
  const slot = SLOT_RANGES.find((item) => item.mealType === mealType);
  if (!slot) return false;
  if (slot.startMinute <= slot.endMinute) {
    return minuteOfDay >= slot.startMinute && minuteOfDay <= slot.endMinute;
  }
  return minuteOfDay >= slot.startMinute || minuteOfDay <= slot.endMinute;
}

export function formatScheduleTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function parseScheduleDateTime(dateKey: string, time: string) {
  const date = parseDateInput(dateKey);
  const minutes = getMinutesFromTime(time) ?? 0;
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

export function getScheduleDateWindow(now = new Date()) {
  const minDate = toDateInput(now);
  const currentWeekStart = startOfWeekMonday(minDate);
  return {
    minDate,
    maxDate: toDateInput(addDays(currentWeekStart, 13)),
    currentWeekStart: toDateInput(currentWeekStart),
    nextWeekStart: toDateInput(addDays(currentWeekStart, 7)),
  };
}

export function getScheduleDateGroups(now = new Date()): ScheduleDateGroup[] {
  const window = getScheduleDateWindow(now);
  const buildDates = (startDate: string) => Array.from({ length: 7 }, (_, index) => {
    const date = addDays(parseDateInput(startDate), index);
    const value = toDateInput(date);
    return {
      value,
      weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      dayMonth: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      disabled: value < window.minDate,
    };
  });

  return [
    {
      key: "current",
      label: "Tuần hiện tại",
      dates: buildDates(window.currentWeekStart),
    },
    {
      key: "next",
      label: "Tuần sau",
      dates: buildDates(window.nextWeekStart),
    },
  ];
}

export function getScheduleValidationMessage(
  dateKey: string,
  time: string,
  now = new Date()
) {
  if (!isValidScheduleDate(dateKey)) {
    return "Ngày lên lịch không hợp lệ.";
  }
  if (!TIME_PATTERN.test(time)) {
    return "Giờ lên lịch phải đúng định dạng HH:mm.";
  }

  const todayKey = toDateInput(now);
  const { maxDate } = getScheduleDateWindow(now);
  if (dateKey < todayKey) {
    return "Không thể lên lịch cho một ngày trong quá khứ.";
  }
  if (dateKey > maxDate) {
    return "Chỉ có thể lên lịch trong tuần hiện tại và tuần kế tiếp.";
  }
  if (parseScheduleDateTime(dateKey, time).getTime() < now.getTime()) {
    return "Không thể chọn thời gian đã qua.";
  }
  return null;
}

function roundUpToFiveMinutes(value: Date) {
  const rounded = new Date(value);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(Math.ceil((rounded.getMinutes() + 1) / 5) * 5);
  return rounded;
}

export function getTimeForMealSlot(
  mealType: MealType,
  dateKey: string,
  now = new Date()
) {
  const option = mealTypeOptions.find((item) => item.key === mealType);
  const window = getScheduleDateWindow(now);
  if (
    !option
    || !isValidScheduleDate(dateKey)
    || dateKey < window.minDate
    || dateKey > window.maxDate
  ) {
    return null;
  }

  const todayKey = window.minDate;
  if (dateKey > todayKey) return option.time;

  const currentMinute = now.getHours() * 60 + now.getMinutes();
  if (isMinuteInSlot(currentMinute, mealType)) {
    const rounded = roundUpToFiveMinutes(now);
    const roundedTime = formatScheduleTime(rounded);
    const roundedMinute = getMinutesFromTime(roundedTime);
    if (
      toDateInput(rounded) === todayKey
      && roundedMinute !== null
      && isMinuteInSlot(roundedMinute, mealType)
    ) {
      return roundedTime;
    }
  }

  if (!getScheduleValidationMessage(dateKey, option.time, now)) return option.time;
  return null;
}

export function getInitialScheduleDateTime(preferredDate: string, now = new Date()) {
  const window = getScheduleDateWindow(now);
  const todayKey = window.minDate;
  const dateKey = isValidScheduleDate(preferredDate)
    && preferredDate >= window.minDate
    && preferredDate <= window.maxDate
    ? preferredDate
    : todayKey;

  if (dateKey > todayKey) {
    return { date: dateKey, time: mealTypeOptions[0].time, mealType: mealTypeOptions[0].key };
  }

  const currentMealType = getMealTypeForTime(formatScheduleTime(now));
  const currentSlotTime = getTimeForMealSlot(currentMealType, todayKey, now);
  if (currentSlotTime) {
    return { date: todayKey, time: currentSlotTime, mealType: currentMealType };
  }

  const nextSlot = mealTypeOptions.find(
    (option) => parseScheduleDateTime(todayKey, option.time).getTime() >= now.getTime()
  );
  if (nextSlot) {
    return { date: todayKey, time: nextSlot.time, mealType: nextSlot.key };
  }

  const rounded = roundUpToFiveMinutes(now);
  if (toDateInput(rounded) === todayKey) {
    const time = formatScheduleTime(rounded);
    return { date: todayKey, time, mealType: getMealTypeForTime(time) };
  }

  const tomorrow = toDateInput(addDays(now, 1));
  return { date: tomorrow, time: mealTypeOptions[0].time, mealType: mealTypeOptions[0].key };
}

export function getMealPlanDateKey(plan: MealPlan) {
  if (plan.planDateKey) return plan.planDateKey;
  return toDateInput(new Date(plan.planDate));
}

export function isDateWithinRange(dateKey: string, startDate: string, endDate: string) {
  return dateKey >= startDate && dateKey <= endDate;
}

export function getAdjacentWeekSelection(
  visibleWeekStart: string,
  activeDate: string,
  offset: number
) {
  const currentWeekStart = parseDateInput(visibleWeekStart);
  const currentActive = parseDateInput(activeDate);
  const selectedDayOffset = Math.min(
    6,
    Math.max(0, Math.round((currentActive.getTime() - currentWeekStart.getTime()) / 86400000))
  );
  const nextWeekStart = toDateInput(addDays(currentWeekStart, offset * 7));

  return {
    weekStart: nextWeekStart,
    activeDate: toDateInput(addDays(parseDateInput(nextWeekStart), selectedDayOffset)),
  };
}
