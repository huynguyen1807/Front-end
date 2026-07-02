import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNavbar from "../../../components/layout/BottomNavbar";
import ScreenContainer from "../../../components/layout/ScreenContainer";
import TopNavbar from "../../../components/layout/TopNavbar";
import { COLORS } from "../../../constants/colors";
import AdminDataConsole from "../../adminData/components/AdminDataConsole";
import RecipeCard from "../../recipes/components/RecipeCard";
import UserRecipePanel from "../../recipes/components/UserRecipePanel";
import DailyGoalCard from "../components/DailyGoalCard";
import DailyPlanGenerator from "../components/DailyPlanGenerator";
import InventoryBucket from "../components/InventoryBucket";
import MealSchedule from "../components/MealSchedule";
import PlannerDetailTabs from "../components/PlannerDetailTabs";
import PlannerHero from "../components/PlannerHero";
import VideoRecipeExtractor from "../components/VideoRecipeExtractor";
import ChipButton from "../components/shared/ChipButton";
import MetricGrid from "../components/shared/MetricGrid";
import Section from "../components/shared/Section";
import { mealTypeOptions } from "../constants/plannerConstants";
import usePlannerScreen from "../hooks/usePlannerScreen";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = Platform.OS === "ios" ? 104 + insets.bottom : 104;
  const planner = usePlannerScreen();
  const [recommendedModalVisible, setRecommendedModalVisible] = useState(false);
  const recommendedRecipes = useMemo(() => {
    const source = planner.generatedResult?.recommendations.length
      ? planner.generatedResult.recommendations.map((item) => item.recipe)
      : planner.recipes;
    const map = new Map<string, (typeof source)[number]>();
    source.forEach((recipe) => {
      if (recipe?._id && recipe.isActive !== false) {
        map.set(recipe._id, recipe);
      }
    });
    return Array.from(map.values());
  }, [planner.generatedResult, planner.recipes]);
  const topRecommendedRecipes = recommendedRecipes.slice(0, 3);

  const renderPlannerTab = () => {
    if (planner.detailTab === "inventory") {
      return (
        <Section
          title="Thực phẩm"
          subtitle="Thực phẩm hiện có trong inventory. Có thể đưa trực tiếp vào lịch bữa ăn và vẫn tính kcal/macros như recipe."
        >
          <InventoryBucket
            title="Sắp hết hạn"
            tone="warning"
            foods={planner.inventoryBuckets.nearExpiry}
            onAddToPlan={planner.handleAddFoodToPlan}
          />
          <InventoryBucket
            title="Còn tốt"
            tone="safe"
            foods={planner.inventoryBuckets.safe}
            onAddToPlan={planner.handleAddFoodToPlan}
          />
          {planner.generatedResult && (
            <MetricGrid
              metrics={[
                {
                  label: "Inventory ưu tiên",
                  value: `${planner.generatedResult.inventoryPriority.length} món`,
                },
                {
                  label: "Recipe match",
                  value: `${planner.generatedResult.recommendations.length} gợi ý`,
                },
              ]}
            />
          )}
        </Section>
      );
    }

    if (planner.detailTab === "schedule") {
      return (
        <MealSchedule
          dates={planner.dates}
          activeDate={planner.activeDate}
          plans={planner.plans}
          onChangeDate={planner.setActiveDate}
          onCycleMealStatus={planner.handleCycleMealStatus}
          onRemoveMeal={planner.handleRemoveMeal}
          onDeletePlan={planner.handleDeletePlan}
        />
      );
    }

    if (planner.detailTab === "macro") {
      return (
        <Section title="Macro Report" subtitle="Tổng hợp tuần dựa trên meal plan đã lưu.">
          {planner.report ? (
            <MetricGrid
              metrics={[
                {
                  label: "Calories tuần",
                  value: `${Math.round(planner.report.totalCalories)} kcal`,
                },
                {
                  label: "Trung bình/ngày",
                  value: `${Math.round(planner.report.averageCalories)} kcal`,
                },
                { label: "Protein", value: `${Math.round(planner.report.totalProtein)}g` },
                { label: "Carbs", value: `${Math.round(planner.report.totalCarbs)}g` },
                { label: "Fat", value: `${Math.round(planner.report.totalFat)}g` },
              ]}
            />
          ) : (
            <Text style={styles.emptyText}>Chưa có macro report.</Text>
          )}
        </Section>
      );
    }

    if (planner.detailTab === "calories") {
      return (
        <Section
          title="Calculate Meal Calories"
          subtitle="Calories và macro được tính theo từng meal trong daily plan."
        >
          <MetricGrid
            metrics={[
              { label: "Daily calories", value: `${Math.round(planner.dayTotals.calories)} kcal` },
              { label: "Protein", value: `${Math.round(planner.dayTotals.macroSummary.protein)}g` },
              { label: "Carbs", value: `${Math.round(planner.dayTotals.macroSummary.carbs)}g` },
              { label: "Fat", value: `${Math.round(planner.dayTotals.macroSummary.fat)}g` },
            ]}
          />
        </Section>
      );
    }

    if (planner.detailTab === "recipes") {
      return (
        <UserRecipePanel
          recipes={planner.userRecipes}
          recipeForm={planner.userRecipeForm}
          setRecipeForm={planner.setUserRecipeForm}
          availabilityByRecipeId={planner.userRecipeAvailability}
          saving={planner.saving}
          onSaveRecipe={planner.handleSaveUserRecipe}
          onEditRecipe={planner.fillUserRecipeForm}
          onDeleteRecipe={planner.handleDeleteUserRecipe}
          onAddToPlan={planner.handleAddRecipeToPlan}
        />
      );
    }

    return (
      <VideoRecipeExtractor
        videoUrl={planner.videoUrl}
        extraction={planner.videoExtraction}
        onChangeVideoUrl={planner.setVideoUrl}
        onExtract={planner.handleExtractVideo}
      />
    );
  };

  return (
    <ScreenContainer>
      <TopNavbar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={planner.loading} onRefresh={planner.loadPlanner} />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace }]}
      >
        <PlannerHero
          isAdmin={planner.isAdmin}
          workspace={planner.workspace}
          onChangeWorkspace={planner.setWorkspace}
          foods={planner.foods}
          plans={planner.plans}
          aiReviewCount={planner.aiReviewItems.length}
        />

        {planner.workspace === "meal" && (
          <>
            <DailyGoalCard
              currentCalories={planner.dayTotals.calories}
              targetCalories={Number(planner.targetCalories) || 2000}
              macroSummary={planner.dayTotals.macroSummary}
            />

            <DailyPlanGenerator
              selectedCalorieGoal={planner.selectedCalorieGoal}
              selectedMealTypes={planner.selectedMealTypes}
              generatedResult={planner.generatedResult}
              saving={planner.saving}
              onSelectCalorieGoal={planner.setSelectedCalorieGoal}
              onToggleMealType={planner.toggleMealType}
              onGenerate={planner.handleGenerateDailyPlan}
            />

            <Section
              title="Recommended Recipes"
              subtitle="AI tạo recipe từ inventory, ưu tiên thực phẩm sắp hết hạn, kcal mục tiêu và sở thích."
            >
              {planner.loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              ) : recommendedRecipes.length === 0 ? (
                <Text style={styles.emptyText}>
                  Chưa có recipe gợi ý. Bấm Generate plan để AI tạo recipe từ inventory.
                </Text>
              ) : (
                <>
                  {topRecommendedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onAddToPlan={planner.handleAddRecipeToPlan}
                    />
                  ))}
                  {recommendedRecipes.length > 3 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.seeAllButton}
                      onPress={() => setRecommendedModalVisible(true)}
                    >
                      <Text style={styles.seeAllButtonText}>Xem tất cả</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Section>

            <PlannerDetailTabs
              activeTab={planner.detailTab}
              onChangeTab={planner.setDetailTab}
            >
              {renderPlannerTab()}
            </PlannerDetailTabs>
          </>
        )}

        {planner.workspace === "admin" && planner.isAdmin && (
          <AdminDataConsole
            activeSection={planner.adminSection}
            onChangeSection={planner.setAdminSection}
            categories={planner.categories}
            storageRules={planner.storageRules}
            nutritionFacts={planner.nutritionFacts}
            adminRecipes={planner.adminRecipes}
            aiReviewItems={planner.aiReviewItems}
            categoryForm={planner.categoryForm}
            setCategoryForm={planner.setCategoryForm}
            storageRuleForm={planner.storageRuleForm}
            setStorageRuleForm={planner.setStorageRuleForm}
            factForm={planner.factForm}
            setFactForm={planner.setFactForm}
            recipeForm={planner.recipeForm}
            setRecipeForm={planner.setRecipeForm}
            calculation={planner.calculation}
            saving={planner.saving}
            onSaveCategory={planner.handleSaveCategory}
            onDeleteCategory={planner.handleDeleteCategory}
            onSaveStorageRule={planner.handleSaveStorageRule}
            onDeleteStorageRule={planner.handleDeleteStorageRule}
            onSaveNutritionFact={planner.handleSaveNutritionFact}
            onDeleteNutritionFact={planner.handleDeleteNutritionFact}
            onSaveRecipe={planner.handleSaveRecipe}
            onDeleteRecipe={planner.handleDeleteRecipe}
            onEditRecipe={planner.fillRecipeForm}
            onResetRecipe={planner.resetRecipeForm}
            onCalculateRecipeNutrition={planner.handleCalculateRecipeNutrition}
            onReviewAiData={planner.handleReviewAiData}
          />
        )}

        {planner.saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.savingText}>Đang lưu...</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={recommendedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecommendedModalVisible(false)}
      >
        <View style={styles.detailBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Recommended Recipes</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailCloseButton}
                onPress={() => setRecommendedModalVisible(false)}
              >
                <Text style={styles.detailCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {recommendedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onAddToPlan={planner.handleAddRecipeToPlan}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(planner.scheduleDraft)}
        transparent
        animationType="fade"
        onRequestClose={planner.closeScheduleModal}
      >
        <View style={styles.detailBackdrop}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {planner.scheduleDraft?.type === "recipe"
                  ? planner.scheduleDraft.recipe.recipeName
                  : planner.scheduleDraft?.food.foodName || "Lên lịch"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailCloseButton}
                onPress={planner.closeScheduleModal}
              >
                <Text style={styles.detailCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Chọn khung giờ bữa ăn và có thể chỉnh giờ theo nhu cầu.
            </Text>
            <View style={styles.segmentRow}>
              {mealTypeOptions.map((option) => (
                <ChipButton
                  key={option.key}
                  label={`${option.label} ${option.time}`}
                  active={planner.scheduleMealType === option.key}
                  onPress={() => planner.handleSelectScheduleMealType(option.key)}
                />
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={planner.scheduleTime}
              onChangeText={planner.setScheduleTime}
              placeholder="HH:mm"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.confirmScheduleButton}
                disabled={planner.saving}
                onPress={planner.handleConfirmScheduleMeal}
              >
                <Text style={styles.confirmScheduleButtonText}>Xác nhận lên lịch</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.cancelScheduleButton}
                onPress={planner.closeScheduleModal}
              >
                <Text style={styles.cancelScheduleButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(planner.missingIngredientPrompt)}
        transparent
        animationType="fade"
        onRequestClose={planner.closeMissingIngredientPrompt}
      >
        <View style={styles.noticeBackdrop}>
          <View style={styles.noticeSheet}>
            <View style={styles.noticeIconWrap}>
              <MaterialCommunityIcons name="basket-plus-outline" size={32} color={COLORS.onSecondaryContainer} />
            </View>
            <Text style={styles.noticeTitle}>Thiếu nguyên liệu</Text>
            <Text style={styles.noticeText}>
              {planner.missingIngredientPrompt?.sourceName
                ? `"${planner.missingIngredientPrompt.sourceName}" còn thiếu vài nguyên liệu. Bạn có muốn thêm vào shopping list để mua bổ sung không?`
                : "Bạn có muốn thêm các nguyên liệu thiếu vào shopping list không?"}
            </Text>
            <View style={styles.noticeList}>
              {planner.missingIngredientPrompt?.items.map((item) => (
                <View key={`${item.ingredientName}-${item.unit}`} style={styles.noticeItemRow}>
                  <MaterialCommunityIcons name="plus-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.noticeItemText}>
                    {item.ingredientName} - {item.quantity} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.noticePrimaryButton}
                disabled={planner.saving}
                onPress={planner.handleAddMissingIngredientsToShoppingList}
              >
                <Text style={styles.noticePrimaryButtonText}>Thêm vào shopping list</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.noticeSecondaryButton}
                onPress={planner.closeMissingIngredientPrompt}
              >
                <Text style={styles.noticeSecondaryButtonText}>Để sau</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavbar />
    </ScreenContainer>
  );
}
