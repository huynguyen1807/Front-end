import { Recipe, ScheduleDate, TimelineItemType } from "../types/planner";

export const mockDates: ScheduleDate[] = [
  { id: "mon", label: "Thứ Hai (Nay)" },
  { id: "tue", label: "Thứ Ba" },
  { id: "wed", label: "Thứ Tư" },
  { id: "thu", label: "Thứ Năm" },
];

export const mockSuggestedRecipes: Recipe[] = [
  {
    id: "r1",
    title: "Salad Ức Gà Bơ",
    time: "15 phút",
    kcal: 350,
    tags: ["GIÀU PROTEIN", "LOW CARB"],
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },
  {
    id: "r2",
    title: "Buddha Bowl Thuần Chay",
    time: "25 phút",
    kcal: 420,
    tags: ["THUẦN CHAY", "NHIỀU XƠ"],
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  },
];

export const mockTimelineItems: TimelineItemType[] = [
  {
    id: "t1",
    time: "08:00",
    title: "Sữa chua Hy Lạp & Trái cây",
    statusText: "Đã hoàn thành",
    kcal: 280,
    status: "completed",
  },
  {
    id: "t2",
    time: "12:30",
    title: "Salad Ức Gà Bơ",
    statusText: "Đang chuẩn bị",
    kcal: 350,
    status: "current",
  },
  {
    id: "t3",
    time: "19:00",
    title: "Cá hồi nướng măng tây",
    statusText: "Chưa thực hiện",
    kcal: 570,
    status: "upcoming",
  },
];
