import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
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
import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import { useNavigation } from "../../../app/providers/NavigationProvider";
import { addShoppingItemScreenStyles as styles } from "../styles/AddShoppingItemScreen.styles";

interface ItemData {
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

export default function AddShoppingItemScreen() {
  const insets = useSafeAreaInsets();
  const { setActiveTab } = useNavigation();
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
    setActiveTab("home");
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
  const bannerBottom = 16;

  const selectedSummaryText = selectedItems.map((i) => i.name).join(", ");

  return (
    <ScreenContainer>
      <SafeAreaView edges={["top"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Thêm vào danh sách</Text>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace }]}
        >
          {/* Suggestions Section */}
          {filteredSuggestions.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gợi ý từ tủ lạnh</Text>
                <TouchableOpacity activeOpacity={0.7}>
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
                    <View key={item.id} style={styles.suggestionCard}>
                      <Image source={{ uri: item.image }} style={styles.cardImage} />
                      {item.badge && (
                        <View
                          style={[
                            styles.cardBadge,
                            { backgroundColor: item.badge.color },
                          ]}
                        >
                          <Text style={styles.cardBadgeText}>
                            {item.badge.text}
                          </Text>
                        </View>
                      )}
                      <View style={styles.cardInfo}>
                        <Text numberOfLines={1} style={styles.itemName}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemQty}>{item.unit}</Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => toggleSelect(item)}
                          style={[
                            styles.addBtn,
                            selected && { backgroundColor: "#745b00" }, // Different color if added
                          ]}
                        >
                          <Ionicons
                            name={selected ? "checkmark" : "add"}
                            size={16}
                            color="#ffffff"
                          />
                          <Text style={styles.addBtnText}>
                            {selected ? "Đã thêm" : "Thêm"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
                <View key={item.id} style={styles.popularItemRow}>
                  <View style={styles.popularItemLeft}>
                    <Image source={{ uri: item.image }} style={styles.popularItemImage} />
                    <View style={styles.popularItemInfo}>
                      <Text style={styles.popularItemName}>{item.name}</Text>
                      <Text style={styles.popularItemQty}>{item.unit}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleSelect(item)}
                    style={[
                      styles.circleActionBtn,
                      selected && styles.circleActionBtnActive,
                    ]}
                  >
                    <Ionicons
                      name={selected ? "checkmark" : "add"}
                      size={20}
                      color={selected ? "#ffffff" : "#757575"}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Selected floating banner */}
        {selectedItems.length > 0 && (
          <View style={[styles.floatingBanner, { bottom: bannerBottom }]}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerBadgeCircle}>
                <Text style={styles.bannerBadgeCircleText}>
                  {selectedItems.length}
                </Text>
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>
                  Đã chọn {selectedItems.length} món
                </Text>
                <Text numberOfLines={1} style={styles.bannerSub}>
                  {selectedSummaryText}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDone}
              style={styles.bannerConfirmBtn}
            >
              <Text style={styles.bannerConfirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Persistent Bottom Navbar */}
      <BottomNavbar />
    </ScreenContainer>
  );
}
