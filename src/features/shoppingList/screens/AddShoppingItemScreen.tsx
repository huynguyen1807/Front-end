import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import FilterChip from "../../../components/common/FilterChip";
import { COLORS } from "../../../constants/colors";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import { addShoppingItemScreenStyles as styles } from "../styles/AddShoppingItemScreen.styles";
import { ItemData } from "../types/shopping";
import SuggestionCard from "../components/SuggestionCard";
import PopularItemRow from "../components/PopularItemRow";
import SelectedFloatingBanner from "../components/SelectedFloatingBanner";

const suggestions: ItemData[] = [
  {
    id: "s1",
    name: "Chuối",
    unit: "1 nải",
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=250&auto=format&fit=crop&q=80",
    category: "other",
    badge: { text: "HẾT", color: "#ad292f" },
  },
  {
    id: "s2",
    name: "Cải bó xôi",
    unit: "300g",
    image:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=250&auto=format&fit=crop&q=80",
    category: "vegetables",
    badge: { text: "SẮP HẾT", color: "#745b00" },
  },
];

const popularItems: ItemData[] = [
  {
    id: "p1",
    name: "Thịt bò băm",
    unit: "500g",
    image:
      "https://images.unsplash.com/photo-1588168333986-5078647a52dd?w=250&auto=format&fit=crop&q=80",
    category: "meat",
  },
  {
    id: "p2",
    name: "Sữa tươi nguyên chất",
    unit: "1 Lít",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=250&auto=format&fit=crop&q=80",
    category: "milk",
  },
  {
    id: "p3",
    name: "Cam sành",
    unit: "1kg",
    image:
      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=250&auto=format&fit=crop&q=80",
    category: "other",
  },
  {
    id: "p4",
    name: "Trứng gà ta",
    unit: "10 quả",
    image:
      "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=250&auto=format&fit=crop&q=80",
    category: "milk",
  },
];

const filterOptions = [
  { key: "all", label: "Tất cả" },
  { key: "vegetables", label: "Rau củ" },
  { key: "meat", label: "Thịt cá" },
  { key: "milk", label: "Sữa & Trứng" },
];

interface AddShoppingItemScreenProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function AddShoppingItemScreen({
  onClose,
  onConfirm,
}: AddShoppingItemScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Pre-select 'Cam sành' to match the screenshot design
  const [selectedItems, setSelectedItems] = useState<ItemData[]>([
    popularItems[2],
  ]);

  const isSelected = (item: ItemData) =>
    selectedItems.some((selected) => selected.id === item.id);

  const toggleSelect = (item: ItemData) => {
    if (isSelected(item)) {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleDone = () => {
    onConfirm();
  };

  const handleSeeAll = () => {
    const list = suggestions.map((item) => `• ${item.name} (${item.unit})`).join("\n");
    Alert.alert("Gợi ý từ tủ lạnh", list);
  };

  // Filter lists based on Search Text and Filter Chips
  const filterItem = (item: ItemData) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
      activeFilter === "all" || item.category === activeFilter;
    return matchesSearch && matchesCategory;
  };

  const filteredSuggestions = suggestions.filter(filterItem);
  const filteredPopular = popularItems.filter(filterItem);

  const bottomSpace = 100;
  const selectedSummaryText = selectedItems.map((i) => i.name).join(", ");

  return (
    <ScreenContainer>
      <SafeAreaView edges={["top"]} style={styles.container}>
        {/* Header with Close and Done actions */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={{ flexDirection: "row", alignItems: "center", paddingRight: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { flex: 1, textAlign: "left" }]}>Thêm thực phẩm</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleDone}>
            <Text style={styles.doneText}>Xong</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#9e9e9e"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Tìm thực phẩm..."
            placeholderTextColor="#9e9e9e"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Chips Horizontally */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipList}
          contentContainerStyle={styles.chipListContent}
        >
          {filterOptions.map((opt) => (
            <FilterChip
              key={opt.key}
              label={opt.label}
              active={activeFilter === opt.key}
              onPress={() => setActiveFilter(opt.key)}
            />
          ))}
        </ScrollView>

        {/* Scrollable Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace }]}
        >
          {/* Suggestions Section */}
          {filteredSuggestions.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gợi ý từ tủ lạnh</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalList}
                contentContainerStyle={styles.horizontalListContent}
              >
                {filteredSuggestions.map((item) => {
                  const selected = isSelected(item);
                  return (
                    <SuggestionCard
                      key={item.id}
                      item={item}
                      selected={selected}
                      onToggleSelect={() => toggleSelect(item)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Popular Categories/Items Section */}
          <View style={styles.popularHeader}>
            <Text style={styles.sectionTitle}>Danh mục phổ biến</Text>
          </View>

          <View style={styles.popularList}>
            {filteredPopular.map((item) => {
              const selected = isSelected(item);
              return (
                <PopularItemRow
                  key={item.id}
                  item={item}
                  selected={selected}
                  onToggleSelect={() => toggleSelect(item)}
                />
              );
            })}
          </View>
        </ScrollView>

        {/* Selected floating banner */}
        {selectedItems.length > 0 && (
          <SelectedFloatingBanner
            selectedItemsCount={selectedItems.length}
            selectedSummaryText={selectedSummaryText}
            onConfirm={handleDone}
          />
        )}
      </SafeAreaView>
    </ScreenContainer>
  );
}
