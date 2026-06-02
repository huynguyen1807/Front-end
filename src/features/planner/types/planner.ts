export interface Recipe {
  id: string;
  title: string;
  time: string;
  kcal: number;
  tags: string[];
  imageUrl: string;
}

export interface TimelineItemType {
  id: string;
  time: string;
  title: string;
  statusText: string;
  kcal: number;
  status: "completed" | "current" | "upcoming";
}

export interface ScheduleDate {
  id: string;
  label: string;
}
