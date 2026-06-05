export interface ChecklistItem {
  id: string;
  name: string;
  subtext: string;
  checked: boolean;
  category: "vegetables" | "meat" | "spices";
}
