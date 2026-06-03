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
