export interface ItemData {
  id: string;
  name: string;
  unit: string;
  image: string;
  category: "vegetables" | "meat" | "milk" | "other";
  badge?: {
    text: string;
    color: string;
  };
}

export interface ChecklistItem {
  id: string;
  name: string;
  subtext: string;
  checked: boolean;
  category: "vegetables" | "meat" | "spices";
}
