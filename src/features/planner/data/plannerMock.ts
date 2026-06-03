import { Recipe, ScheduleDate, TimelineItemType } from "../types/planner";
import { ChecklistItem } from "../../shoppingList/types/shopping";

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
    title: "Sữa yogurt Hy Lạp & Trái cây",
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

export const mockInitialChecklist: ChecklistItem[] = [
  // Vegetables
  {
    id: "c1",
    name: "Cải bó xôi (Spinach)",
    subtext: "2 bó • Freshness Priority",
    checked: false,
    category: "vegetables",
  },
  {
    id: "c2",
    name: "Cà chua bi",
    subtext: "500g • Organic preference",
    checked: false,
    category: "vegetables",
  },
  {
    id: "c3",
    name: "Bông cải xanh",
    subtext: "1 cây lớn",
    checked: false,
    category: "vegetables",
  },
  // Meat & Fish
  {
    id: "c4",
    name: "Ức gà phile",
    subtext: "1.5kg • Weekly Meal Prep",
    checked: false,
    category: "meat",
  },
  {
    id: "c5",
    name: "Cá hồi tươi",
    subtext: "400g • Atlantic Salmon",
    checked: false,
    category: "meat",
  },
  // Spices
  {
    id: "c6",
    name: "Dầu Oliu Extra Virgin",
    subtext: "1 chai 500ml",
    checked: false,
    category: "spices",
  },
  {
    id: "c7",
    name: "Tương bần",
    subtext: "1 hũ nhỏ",
    checked: false,
    category: "spices",
  },
];
