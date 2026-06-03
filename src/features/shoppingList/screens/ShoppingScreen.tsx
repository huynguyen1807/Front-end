import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";
import TopNavbar from "../../../components/layout/TopNavbar";
import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import { useNavigation } from "../../../app/providers/NavigationProvider";
import { shoppingScreenStyles as styles } from "../styles/ShoppingScreen.styles";
import { ChecklistItem } from "../types/shopping";
import AddShoppingItemScreen from "./AddShoppingItemScreen";

const initialChecklist: ChecklistItem[] = [
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

type CategoryKey = "vegetables" | "meat" | "spices";

interface CategoryConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const CATEGORIES: Record<CategoryKey, CategoryConfig> = {
  vegetables: {
    title: "Rau củ",
    icon: "leaf-outline",
    iconColor: COLORS.primary,
  },
  meat: {
    title: "Thịt cá",
    icon: "restaurant-outline",
    iconColor: COLORS.tertiary,
  },
  spices: {
    title: "Gia vị",
    icon: "flask-outline",
    iconColor: "#a85c2c",
  },
};

export default function ShoppingScreen() {
  const { setActiveTab } = useNavigation();
  const [isAdding, setIsAdding] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleConfirm = () => {
    setIsAdding(false);
    setActiveTab("meal");
  };

  const handleClose = () => {
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <AddShoppingItemScreen onClose={handleClose} onConfirm={handleConfirm} />
    );
  }

  // Group items by category
  const categoriesList: CategoryKey[] = ["vegetables", "meat", "spices"];

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        style={styles.container}
      >
        {/* Main Header */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Shopping List</Text>
          <Text style={styles.subtitle}>
            Items needed for your next kitchen run.
          </Text>
        </View>

        {/* Auto Add from Stock Out Banner */}
        <TouchableOpacity activeOpacity={0.9} style={styles.bannerButton}>
          <View style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Ionicons name="sparkles" size={20} color={COLORS.onPrimary} />
              <Text style={styles.bannerText}>Tự động thêm từ kho đã hết</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.onPrimary} />
          </View>
        </TouchableOpacity>

        {/* Categories checklist */}
        {categoriesList.map((catKey) => {
          const categoryItems = items.filter((i) => i.category === catKey);
          if (categoryItems.length === 0) return null;

          const config = CATEGORIES[catKey];
          return (
            <View key={catKey} style={styles.section}>
              {/* Category Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name={config.icon} size={22} color={config.iconColor} />
                  <Text style={styles.sectionTitle}>{config.title}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {categoryItems.length} items
                  </Text>
                </View>
              </View>

              {/* Items Card */}
              <View style={styles.card}>
                {categoryItems.map((item, idx) => {
                  const isLast = idx === categoryItems.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => toggleItem(item.id)}
                      style={[styles.itemRow, isLast && styles.itemRowLast]}
                    >
                      <View style={styles.checkbox}>
                        <Ionicons
                          name={item.checked ? "checkbox" : "square-outline"}
                          size={24}
                          color={item.checked ? COLORS.primary : COLORS.outlineVariant}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text
                          style={[
                            styles.itemName,
                            item.checked && styles.itemNameChecked,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.itemSubtext}>{item.subtext}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => setIsAdding(true)}
      >
        <Ionicons name="add" size={30} color={COLORS.onPrimary} />
      </TouchableOpacity>

      <BottomNavbar />
    </ScreenContainer>
  );
}
