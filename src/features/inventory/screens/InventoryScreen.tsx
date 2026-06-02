import { Ionicons } from "@expo/vector-icons";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FilterChip from "../../../components/common/FilterChip";
import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { COLORS } from "../../../constants/colors";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import InventoryCard from "../components/InventoryCard";
import SummaryCard from "../components/SummaryCard";
import WasteCard from "../components/WasteCard";
import { setActiveFilter } from "../redux/inventorySlice";
import { inventoryScreenStyles as styles } from "../styles/InventoryScreen.styles";
import { InventoryFilter } from "../types/inventory";

const filters: {
  key: InventoryFilter;
  label: string;
  danger?: boolean;
}[] = [
  { key: "all", label: "Tất cả" },
  { key: "fridge", label: "Trong tủ lạnh" },
  { key: "outside", label: "Bên ngoài" },
  { key: "expiring", label: "Sắp hết hạn", danger: true },
];

export default function InventoryDashboardScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { items, activeFilter } = useAppSelector((state) => state.inventory);

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "expiring") return item.daysLeft <= 3;
    return item.storageType === activeFilter;
  });

  const bottomSpace = Platform.OS === "ios" ? 120 + insets.bottom : 120;
  const fabBottom = Platform.OS === "ios" ? 92 + insets.bottom : 92;

  return (
    <ScreenContainer>
      <TopNavbar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomSpace,
          },
        ]}
      >
        <View style={styles.summaryWrapper}>
          <SummaryCard />
          <WasteCard />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              danger={filter.danger}
              active={activeFilter === filter.key}
              onPress={() => dispatch(setActiveFilter(filter.key))}
            />
          ))}
        </ScrollView>

        <View style={styles.cardList}>
          {filteredItems.map((item) => (
            <InventoryCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.fab,
          {
            bottom: fabBottom,
          },
        ]}
      >
        <Ionicons name="add" size={34} color={COLORS.onPrimary} />
      </TouchableOpacity>

      <BottomNavbar />
    </ScreenContainer>
  );
}
