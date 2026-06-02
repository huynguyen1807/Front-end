import { InventoryItem } from "../types/inventory";

export const inventoryMock: InventoryItem[] = [
  {
    id: "1",
    name: "Bông cải xanh",
    quantity: "500g",
    storageLabel: "Ngăn mát",
    storageType: "fridge",
    daysLeft: 1,
    freshnessPercent: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=1200",
  },
  {
    id: "2",
    name: "Táo đỏ",
    quantity: "6 quả",
    storageLabel: "Kệ bếp",
    storageType: "outside",
    daysLeft: 8,
    freshnessPercent: 80,
    imageUrl:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=1200",
  },
  {
    id: "3",
    name: "Sữa tươi nguyên chất",
    quantity: "1 Lít",
    storageLabel: "Cánh tủ",
    storageType: "fridge",
    daysLeft: 3,
    freshnessPercent: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200",
  },
  {
    id: "4",
    name: "Cà rốt Đà Lạt",
    quantity: "1 kg",
    storageLabel: "Ngăn rau",
    storageType: "fridge",
    daysLeft: 12,
    freshnessPercent: 95,
    imageUrl:
      "https://images.unsplash.com/photo-1447175008436-054170c2e979?q=80&w=1200",
  },
];