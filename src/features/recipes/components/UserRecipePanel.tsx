import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { uploadImageApi } from "../../../services/uploadApi";
import AdminActionButton from "../../adminData/components/shared/AdminActionButton";
import AdminChipButton from "../../adminData/components/shared/AdminChipButton";
import AdminField from "../../adminData/components/shared/AdminField";
import AdminSection from "../../adminData/components/shared/AdminSection";
import { adminDataStyles as styles } from "../../adminData/styles/AdminData.styles";
import {
  RecipeFormState,
  RecipeIngredientFormState,
  createEmptyRecipeForm,
  createEmptyRecipeIngredient,
} from "../../planner/constants/plannerConstants";
import { RecipeAvailability } from "../../planner/types/planner";
import { Recipe } from "../types/recipe";
import RecipeCard from "./RecipeCard";

type UserRecipePanelProps = {
  recipes: Recipe[];
  recipeForm: RecipeFormState;
  setRecipeForm: React.Dispatch<React.SetStateAction<RecipeFormState>>;
  availabilityByRecipeId: Record<string, RecipeAvailability>;
  saving: boolean;
  onSaveRecipe: () => boolean | Promise<boolean>;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipe: Recipe) => void;
  onAddToPlan: (recipe: Recipe) => void;
  onAddMissingIngredients: (recipe: Recipe) => void;
};

const difficultyOptions: Array<{ key: RecipeFormState["difficulty"]; label: string }> = [
  { key: "EASY", label: "Dễ" },
  { key: "MEDIUM", label: "Vừa" },
  { key: "HARD", label: "Khó" },
];

const ensureIngredients = (ingredients?: RecipeIngredientFormState[]) =>
  ingredients?.length ? ingredients : [createEmptyRecipeIngredient()];

type RecipeSortMode = "name" | "calories" | "difficulty";
type RecipeAvailabilityFilter = "all" | "enough" | "missing";

export default function UserRecipePanel({
  recipes,
  recipeForm,
  setRecipeForm,
  availabilityByRecipeId,
  saving,
  onSaveRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onAddToPlan,
  onAddMissingIngredients,
}: UserRecipePanelProps) {
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [allRecipesVisible, setAllRecipesVisible] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSortMode, setRecipeSortMode] = useState<RecipeSortMode>("name");
  const [recipeAvailabilityFilter, setRecipeAvailabilityFilter] =
    useState<RecipeAvailabilityFilter>("all");

  const visibleRecipes = useMemo(() => {
    const keyword = recipeSearch.trim().toLowerCase();
    const textFiltered = keyword
      ? recipes.filter((recipe) =>
          [
            recipe.recipeName,
            recipe.description,
            ...(recipe.tags || []),
            ...(recipe.ingredients || []).map((ingredient) => ingredient.ingredientName),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        )
      : recipes;
    const filtered = textFiltered.filter((recipe) => {
      const availability = availabilityByRecipeId[recipe._id];
      if (recipeAvailabilityFilter === "enough") {
        return availability?.canSchedule !== false;
      }
      if (recipeAvailabilityFilter === "missing") {
        return availability?.canSchedule === false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (recipeSortMode === "calories") {
        return (Number(b.calories) || 0) - (Number(a.calories) || 0);
      }

      if (recipeSortMode === "difficulty") {
        return String(a.difficulty || "").localeCompare(String(b.difficulty || ""));
      }

      return a.recipeName.localeCompare(b.recipeName, "vi");
    });
  }, [availabilityByRecipeId, recipeAvailabilityFilter, recipeSearch, recipeSortMode, recipes]);

  const getRecipeCardState = (recipe: Recipe) => {
    const availability = availabilityByRecipeId[recipe._id] || {
      canSchedule: true,
      matchedIngredients: [],
      missingIngredients: [],
    };
    const missingSet = new Set(
      availability.missingIngredients.map((ingredient) => ingredient.trim().toLowerCase())
    );
    const missingIngredients = availability.canSchedule
      ? []
      : (recipe.ingredients || []).filter((ingredient) =>
          missingSet.has(ingredient.ingredientName.trim().toLowerCase())
        );
    const disabledReason = availability.canSchedule
      ? undefined
      : `Thiếu: ${availability.missingIngredients.join(", ")}`;

    return {
      availability,
      disabledReason,
      recipe: {
        ...recipe,
        availability,
        availabilityStatus: availability.canSchedule
          ? ("ENOUGH_INGREDIENTS" as const)
          : ("MISSING_INGREDIENTS" as const),
        missingIngredients,
      },
    };
  };

  const openCreateRecipe = () => {
    setRecipeForm(createEmptyRecipeForm());
    setRecipeModalVisible(true);
  };

  const openEditRecipe = (recipe: Recipe) => {
    onEditRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const closeRecipeModal = () => {
    setRecipeForm(createEmptyRecipeForm());
    setRecipeModalVisible(false);
  };

  const saveRecipeFromModal = async () => {
    const saved = await onSaveRecipe();
    if (saved !== false) {
      setRecipeModalVisible(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Không có quyền truy cập",
        "Bạn cần cấp quyền thư viện ảnh để chọn ảnh công thức."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const localUri = result.assets[0].uri;
      
      if (localUri.startsWith("file://") || localUri.startsWith("content://")) {
        try {
          setRecipeForm((form) => ({ ...form, imageUrl: "uploading" }));
          const cloudinaryUrl = await uploadImageApi(localUri);
          setRecipeForm((form) => ({ ...form, imageUrl: cloudinaryUrl }));
        } catch (error: any) {
          Alert.alert("Upload thất bại", "Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.");
          setRecipeForm((form) => ({ ...form, imageUrl: "" }));
        }
      } else {
        setRecipeForm((form) => ({ ...form, imageUrl: localUri }));
      }
    }
  };

  const updateIngredient = (
    ingredientId: string,
    patch: Partial<RecipeIngredientFormState>
  ) => {
    setRecipeForm((form) => ({
      ...form,
      ingredients: ensureIngredients(form.ingredients).map((ingredient) =>
        ingredient.id === ingredientId ? { ...ingredient, ...patch } : ingredient
      ),
    }));
  };

  const addIngredient = () => {
    setRecipeForm((form) => ({
      ...form,
      ingredients: [...ensureIngredients(form.ingredients), createEmptyRecipeIngredient()],
    }));
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipeForm((form) => {
      const nextIngredients = ensureIngredients(form.ingredients).filter(
        (ingredient) => ingredient.id !== ingredientId
      );

      return {
        ...form,
        ingredients: nextIngredients.length ? nextIngredients : [createEmptyRecipeIngredient()],
      };
    });
  };

  const addCookingStep = () => {
    setRecipeForm((form) => {
      const step = form.newCookingStep.trim();
      if (!step) return form;

      return {
        ...form,
        cookingSteps: [...(form.cookingSteps || []), step],
        newCookingStep: "",
      };
    });
  };

  const updateCookingStep = (stepIndex: number, value: string) => {
    setRecipeForm((form) => ({
      ...form,
      cookingSteps: (form.cookingSteps || []).map((step, index) =>
        index === stepIndex ? value : step
      ),
    }));
  };

  const removeCookingStep = (stepIndex: number) => {
    setRecipeForm((form) => ({
      ...form,
      cookingSteps: (form.cookingSteps || []).filter((_, index) => index !== stepIndex),
    }));
  };

  const recipeFormContent = (
    <>
      <View style={styles.formBlock}>
        <Text style={styles.formBlockTitle}>Thông tin chính</Text>
        <AdminField label="Tên công thức">
          <TextInput
            style={styles.input}
            value={recipeForm.recipeName}
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, recipeName: value }))
            }
            placeholder="Ví dụ: Salad ức gà biến tấu"
          />
        </AdminField>
        <AdminField label="Mô tả">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={recipeForm.description}
            multiline
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, description: value }))
            }
            placeholder="Ghi chú khẩu vị, cách biến tấu hoặc lý do chọn món"
          />
        </AdminField>
        <View style={styles.formGrid}>
          <AdminField label="Thời gian nấu">
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={recipeForm.cookingTime}
              onChangeText={(value) =>
                setRecipeForm((form) => ({ ...form, cookingTime: value }))
              }
              placeholder="Phút"
            />
          </AdminField>
          <AdminField label="Tags">
            <TextInput
              style={styles.input}
              value={recipeForm.tags}
              onChangeText={(value) => setRecipeForm((form) => ({ ...form, tags: value }))}
              placeholder="healthy, high protein"
            />
          </AdminField>
        </View>
        <AdminField label="Độ khó">
          <View style={styles.segmentRow}>
            {difficultyOptions.map((item) => (
              <AdminChipButton
                key={item.key}
                label={item.label}
                active={recipeForm.difficulty === item.key}
                onPress={() =>
                  setRecipeForm((form) => ({ ...form, difficulty: item.key }))
                }
              />
            ))}
          </View>
        </AdminField>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formBlockTitle}>Ảnh công thức</Text>
        <AdminField label="URL ảnh hoặc ảnh từ thư viện">
          <TextInput
            style={styles.input}
            value={recipeForm.imageUrl === "uploading" ? "Đang tải ảnh lên..." : recipeForm.imageUrl}
            onChangeText={(value) => setRecipeForm((form) => ({ ...form, imageUrl: value }))}
            placeholder="Có thể bỏ trống"
            editable={recipeForm.imageUrl !== "uploading"}
          />
          <View style={styles.actionRow}>
            <AdminActionButton
              label="Chọn ảnh"
              icon="image-plus"
              secondary
              onPress={pickImage}
              disabled={recipeForm.imageUrl === "uploading"}
            />
            {recipeForm.imageUrl && recipeForm.imageUrl !== "uploading" ? (
              <AdminActionButton
                label="Bỏ ảnh"
                icon="image-off-outline"
                secondary
                onPress={() => setRecipeForm((form) => ({ ...form, imageUrl: "" }))}
              />
            ) : null}
          </View>
          {recipeForm.imageUrl && recipeForm.imageUrl !== "uploading" ? (
            <Image source={{ uri: recipeForm.imageUrl }} style={styles.previewImage} />
          ) : null}
        </AdminField>
      </View>

      <View style={styles.formBlock}>
        <View style={styles.formBlockHeader}>
          <Text style={styles.formBlockTitle}>Nguyên liệu</Text>
          <AdminActionButton
            label="Thêm nguyên liệu"
            icon="plus"
            secondary
            onPress={addIngredient}
          />
        </View>
        <Text style={styles.formBlockSubtitle}>
          Nhập tên giống tủ thực phẩm để hệ thống kiểm tra đủ/thiếu nguyên liệu khi đưa vào lịch.
        </Text>
        {ensureIngredients(recipeForm.ingredients).map((ingredient, index) => (
          <View key={ingredient.id} style={styles.formBlock}>
            <View style={styles.formBlockHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.formBlockTitle}>Nguyên liệu {index + 1}</Text>
              <AdminActionButton
                label="Xóa"
                icon="delete-outline"
                secondary
                onPress={() => removeIngredient(ingredient.id)}
              />
            </View>
            <View style={styles.formGrid}>
              <AdminField label="Tên nguyên liệu">
                <TextInput
                  style={styles.input}
                  value={ingredient.ingredientName}
                  onChangeText={(value) =>
                    updateIngredient(ingredient.id, { ingredientName: value })
                  }
                  placeholder="Ví dụ: ức gà"
                />
              </AdminField>
              <AdminField label="Số lượng">
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredient(ingredient.id, { quantity: value })}
                  placeholder="1"
                />
              </AdminField>
              <AdminField label="Đơn vị">
                <TextInput
                  style={styles.input}
                  value={ingredient.unit}
                  onChangeText={(value) => updateIngredient(ingredient.id, { unit: value })}
                  placeholder="g, kg, ml, l, quả, cái..."
                />
              </AdminField>
            </View>
            <View style={styles.segmentRow}>
              <AdminChipButton
                label="Bắt buộc"
                active={ingredient.isRequired}
                onPress={() => updateIngredient(ingredient.id, { isRequired: true })}
              />
              <AdminChipButton
                label="Tùy chọn"
                active={!ingredient.isRequired}
                onPress={() => updateIngredient(ingredient.id, { isRequired: false })}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.formBlock}>
        <View style={styles.formBlockHeader}>
          <Text style={styles.formBlockTitle}>Các bước nấu</Text>
          <AdminActionButton
            label="Thêm bước"
            icon="playlist-plus"
            secondary
            onPress={addCookingStep}
          />
        </View>
        {(recipeForm.cookingSteps || []).map((step, index) => (
          <View key={`step-${index}`} style={styles.formBlock}>
            <View style={styles.formBlockHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.formBlockTitle}>Bước {index + 1}</Text>
              <AdminActionButton
                label="Xóa"
                icon="delete-outline"
                secondary
                onPress={() => removeCookingStep(index)}
              />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={step}
              multiline
              onChangeText={(value) => updateCookingStep(index, value)}
            />
          </View>
        ))}
        <AdminField label="Bước mới">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={recipeForm.newCookingStep}
            multiline
            onChangeText={(value) =>
              setRecipeForm((form) => ({ ...form, newCookingStep: value }))
            }
            placeholder="Ví dụ: Áp chảo ức gà 6 phút mỗi mặt"
          />
        </AdminField>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.formBlockTitle}>Dinh dưỡng</Text>
        <Text style={styles.formBlockSubtitle}>
          Có thể nhập thủ công hoặc để trống calories để backend tính theo nutrition data.
        </Text>
        <View style={styles.formGrid}>
          <AdminField label="Calories">
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={recipeForm.calories}
              onChangeText={(value) =>
                setRecipeForm((form) => ({ ...form, calories: value }))
              }
              placeholder="Tự tính nếu để trống"
            />
          </AdminField>
          <AdminField label="Protein">
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={recipeForm.protein}
              onChangeText={(value) =>
                setRecipeForm((form) => ({ ...form, protein: value }))
              }
            />
          </AdminField>
          <AdminField label="Carbs">
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={recipeForm.carbs}
              onChangeText={(value) => setRecipeForm((form) => ({ ...form, carbs: value }))}
            />
          </AdminField>
          <AdminField label="Fat">
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={recipeForm.fat}
              onChangeText={(value) => setRecipeForm((form) => ({ ...form, fat: value }))}
            />
          </AdminField>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AdminActionButton
          label={recipeForm.id ? "Cập nhật công thức" : "Thêm công thức"}
          icon="content-save-outline"
          onPress={saveRecipeFromModal}
          disabled={saving}
        />
        <AdminActionButton label="Hủy" icon="close" secondary onPress={closeRecipeModal} />
      </View>
    </>
  );

  return (
    <AdminSection
      title="Công thức"
      subtitle="Công thức cá nhân của bạn. Công thức thiếu nguyên liệu trong tủ thực phẩm sẽ bị làm mờ và không thể đưa vào lịch."
    >
      <View style={styles.formBlockHeader}>
        <Text style={styles.formBlockTitle}>Công thức của bạn</Text>
        <AdminActionButton
          label="Xem tất cả"
          icon="format-list-bulleted"
          secondary
          onPress={() => setAllRecipesVisible(true)}
          disabled={recipes.length === 0}
        />
        <AdminActionButton
          label="Thêm công thức"
          icon="plus"
          onPress={openCreateRecipe}
          disabled={saving}
        />
      </View>

      {recipes.length === 0 ? (
        <Text style={styles.emptyText}>Bạn chưa có công thức cá nhân.</Text>
      ) : (
        recipes.map((recipe) => {
          const cardState = getRecipeCardState(recipe);

          return (
            <RecipeCard
              key={recipe._id}
              recipe={cardState.recipe}
              canManage
              disabled={!cardState.availability.canSchedule}
              disabledReason={cardState.disabledReason}
              onAddToPlan={onAddToPlan}
              onAddMissingIngredients={onAddMissingIngredients}
              onEdit={openEditRecipe}
              onDelete={onDeleteRecipe}
            />
          );
        })
      )}

      <Modal
        visible={allRecipesVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllRecipesVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tất cả công thức</Text>
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.iconButton}
                onPress={() => setAllRecipesVisible(false)}
              >
                <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={recipeSearch}
              onChangeText={setRecipeSearch}
              placeholder="Tìm theo tên, tag, nguyên liệu..."
            />
            <Text style={styles.formBlockSubtitle}>Lọc theo nguyên liệu</Text>
            <View style={styles.segmentRow}>
              {[
                { key: "all" as const, label: "Tất cả" },
                { key: "enough" as const, label: "Đủ nguyên liệu" },
                { key: "missing" as const, label: "Thiếu nguyên liệu" },
              ].map((item) => (
                <AdminChipButton
                  key={item.key}
                  label={item.label}
                  active={recipeAvailabilityFilter === item.key}
                  onPress={() => setRecipeAvailabilityFilter(item.key)}
                />
              ))}
            </View>
            <Text style={styles.formBlockSubtitle}>Sắp xếp</Text>
            <View style={styles.segmentRow}>
              {[
                { key: "name" as const, label: "Tên" },
                { key: "calories" as const, label: "Kcal cao" },
                { key: "difficulty" as const, label: "Độ khó" },
              ].map((item) => (
                <AdminChipButton
                  key={item.key}
                  label={item.label}
                  active={recipeSortMode === item.key}
                  onPress={() => setRecipeSortMode(item.key)}
                />
              ))}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {visibleRecipes.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy công thức phù hợp.</Text>
              ) : (
                visibleRecipes.map((recipe) => {
                  const cardState = getRecipeCardState(recipe);

                  return (
                    <RecipeCard
                      key={`all-${recipe._id}`}
                      recipe={cardState.recipe}
                      canManage
                      disabled={!cardState.availability.canSchedule}
                      disabledReason={cardState.disabledReason}
                      onAddToPlan={onAddToPlan}
                      onAddMissingIngredients={onAddMissingIngredients}
                      onEdit={openEditRecipe}
                      onDelete={onDeleteRecipe}
                    />
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={recipeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {recipeForm.id ? "Cập nhật công thức" : "Thêm công thức"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.iconButton}
                onPress={closeRecipeModal}
              >
                <Ionicons name="close" size={22} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {recipeFormContent}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AdminSection>
  );
}
