import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import BodyMassIndexPanel from "../components/BodyMassIndexPanel";
import DailyGoalCard from "../components/DailyGoalCard";
import DailyPlanGenerator from "../components/DailyPlanGenerator";
import InventoryBucket from "../components/InventoryBucket";
import MealSchedulePicker from "../components/MealSchedulePicker";
import MealSchedule from "../components/MealSchedule";
import PlannerDetailTabs from "../components/PlannerDetailTabs";
import PlannerHero from "../components/PlannerHero";
import ScheduleDayRolloverModal from "../components/ScheduleDayRolloverModal";
import VideoRecipeExtractor from "../components/VideoRecipeExtractor";
import MetricGrid from "../components/shared/MetricGrid";
import Section from "../components/shared/Section";
import usePlannerScreen from "../hooks/usePlannerScreen";
import { plannerStyles as styles } from "../styles/PlannerScreen.styles";
import { formatFoodAmount, formatFoodUnit } from "../../../utils/foodUnits";

type RecommendedFilter = "all" | "enough" | "missing";

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = Platform.OS === "ios" ? 104 + insets.bottom : 104;
  const planner = usePlannerScreen();
  const [recommendedModalVisible, setRecommendedModalVisible] = useState(false);
  const [recommendedFilter, setRecommendedFilter] = useState<RecommendedFilter>("all");
  const recommendedItems = planner.recommendedItems;
  const filteredRecommendedItems = useMemo(() => {
    if (recommendedFilter === "enough") {
      return recommendedItems.filter(
        (item) => (item.availabilityStatus || item.recipe.availabilityStatus) === "ENOUGH_INGREDIENTS"
      );
    }
    if (recommendedFilter === "missing") {
      return recommendedItems.filter(
        (item) => (item.availabilityStatus || item.recipe.availabilityStatus) === "MISSING_INGREDIENTS"
      );
    }
    return recommendedItems;
  }, [recommendedFilter, recommendedItems]);
  const topRecommendedItems = filteredRecommendedItems.slice(0, 3);
  const selectRecommendedFilter = (filter: RecommendedFilter) => {
    setRecommendedFilter(filter);
    planner.markRecommendationTabSeen(filter);
  };

  const renderPlannerTab = () => {
    if (planner.detailTab === "inventory") {
      return (
        <Section
          title="Thực phẩm"
          subtitle="Thực phẩm hiện có trong tủ. Có thể đưa trực tiếp vào lịch bữa ăn và vẫn tính kcal/macros như công thức."
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
          <InventoryBucket
            title="Cần kiểm tra"
            tone="warning"
            foods={planner.inventoryBuckets.needsCheck}
            onAddToPlan={planner.handleAddFoodToPlan}
          />
        </Section>
      );
    }

    if (planner.detailTab === "schedule") {
      return (
        <MealSchedule
          dates={planner.dates}
          activeDate={planner.activeDate}
          weekStartDate={planner.weekRange.startDate}
          weekEndDate={planner.weekRange.endDate}
          plans={planner.plans}
          onChangeDate={planner.setActiveDate}
          onChangeWeek={planner.handleChangeWeek}
          onGoToCurrentWeek={planner.handleGoToCurrentWeek}
          onUpdateMealStatus={planner.handleUpdateMealStatus}
          onRemoveMeal={planner.handleRemoveMeal}
          onDeletePlan={planner.handleDeletePlan}
        />
      );
    }

    if (planner.detailTab === "macro") {
      return (
        <Section title="Báo cáo macro" subtitle="Tổng hợp tuần dựa trên lịch bữa ăn đã lưu.">
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

    if (planner.detailTab === "bmi") {
      return (
        <BodyMassIndexPanel
          form={planner.bmiForm}
          profile={planner.bmiProfile}
          saving={planner.saving}
          onChangeForm={planner.setBmiForm}
          onSave={planner.handleSaveBmiProfile}
          onClear={planner.handleClearBmiProfile}
        />
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
          onAddMissingIngredients={planner.handlePromptRecipeMissingIngredients}
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
          recipeCount={planner.recipes.length + planner.userRecipes.length}
          aiReviewCount={planner.aiReviewItems.length}
        />

        {planner.workspace === "meal" && (
          <>
            <DailyGoalCard
              currentCalories={planner.dayTotals.calories}
              targetCalories={Number(planner.targetCalories) || 2000}
              macroSummary={planner.dayTotals.macroSummary}
              onPress={planner.openDailyGoalEditor}
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
              title="Món được gợi ý"
              subtitle="AI tạo món từ tủ thực phẩm, ưu tiên thực phẩm sắp hết hạn, kcal mục tiêu và sở thích."
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recommendationFilterScroll}
                contentContainerStyle={styles.recommendationFilterContent}
              >
                {[
                  { key: "all" as const, label: "Tất cả" },
                  { key: "enough" as const, label: "Đủ nguyên liệu" },
                  { key: "missing" as const, label: "Thiếu nguyên liệu" },
                ].map((tab) => {
                  const active = recommendedFilter === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.78}
                      style={[
                        styles.recommendationChip,
                        active && styles.recommendationChipActive,
                      ]}
                      onPress={() => selectRecommendedFilter(tab.key)}
                    >
                      <Text
                        style={[
                          styles.recommendationChipText,
                          active && styles.recommendationChipTextActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {planner.recommendationBadges[tab.key] ? (
                        <View style={styles.recommendationBadgeDot} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {planner.loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              ) : filteredRecommendedItems.length === 0 ? (
                <Text style={styles.emptyText}>
                  Chưa có món gợi ý. Bấm Tạo món gợi ý để AI tạo món từ tủ thực phẩm.
                </Text>
              ) : (
                <>
                  {topRecommendedItems.map((item, index) => (
                    <RecipeCard
                      key={`${item.recipe._id || item.recipe.recipeName}-${index}`}
                      recipe={item.recipe}
                      onAddToPlan={planner.handleAddRecipeToPlan}
                      onAddMissingIngredients={planner.handlePromptRecipeMissingIngredients}
                      onSaveToRecipes={planner.handleSaveRecommendedRecipe}
                      onDismiss={planner.handleDismissRecommendation}
                    />
                  ))}
                  {filteredRecommendedItems.length > 3 && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.seeAllButton}
                      onPress={() => {
                        planner.markRecommendationTabSeen(recommendedFilter);
                        setRecommendedModalVisible(true);
                      }}
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
              <Text style={styles.detailTitle}>Món được gợi ý</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailCloseButton}
                onPress={() => setRecommendedModalVisible(false)}
              >
                <Text style={styles.detailCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredRecommendedItems.map((item, index) => (
                <RecipeCard
                  key={`${item.recipe._id || item.recipe.recipeName}-${index}`}
                  recipe={item.recipe}
                  onAddToPlan={planner.handleAddRecipeToPlan}
                  onAddMissingIngredients={planner.handlePromptRecipeMissingIngredients}
                  onSaveToRecipes={planner.handleSaveRecommendedRecipe}
                  onDismiss={planner.handleDismissRecommendation}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={planner.dailyGoalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={planner.closeDailyGoalEditor}
      >
        <View style={styles.detailBackdrop}>
          <View style={styles.goalSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Mục tiêu hằng ngày</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.detailCloseButton}
                onPress={planner.closeDailyGoalEditor}
              >
                <Text style={styles.detailCloseText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Điều chỉnh kcal mục tiêu theo thể trạng, nhu cầu luyện tập hoặc chế độ ăn hiện tại.
            </Text>
            <TextInput
              style={styles.goalInput}
              keyboardType="numeric"
              value={planner.dailyGoalDraft}
              onChangeText={planner.setDailyGoalDraft}
              placeholder="Ví dụ: 1800"
            />
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.confirmScheduleButton}
              disabled={planner.saving}
              onPress={planner.handleSaveDailyGoal}
            >
              <Text style={styles.confirmScheduleButtonText}>Lưu mục tiêu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(planner.scheduleDraft)}
        transparent
        animationType="fade"
        onRequestClose={planner.closeScheduleModal}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
        <View style={styles.detailBackdrop}>
          <View style={[styles.detailSheet, styles.scheduleSheet]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scheduleSheetContent}
            >
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
            <MealSchedulePicker
              date={planner.scheduleDate}
              time={planner.scheduleTime}
              mealType={planner.scheduleMealType}
              notice={planner.scheduleNotice}
              rolloverPromptVisible={Boolean(planner.scheduleRolloverPrompt)}
              onChangeDate={planner.handleChangeScheduleDate}
              onChangeTime={planner.handleChangeScheduleTime}
              onSelectMealType={planner.handleSelectScheduleMealType}
              onDismissNotice={planner.clearScheduleNotice}
            />
            {planner.scheduleDraft?.type === "food" ? (
              <View style={styles.quantityPanel}>
                <Text style={styles.quantityLabel}>Số lượng dùng</Text>
                <View style={styles.quantityRow}>
                  <TextInput
                    style={[styles.input, styles.quantityInput]}
                    keyboardType="decimal-pad"
                    value={planner.scheduleFoodQuantity}
                    onChangeText={planner.setScheduleFoodQuantity}
                    placeholder="Nhập số lượng"
                  />
                  <Text style={styles.quantityUnit}>
                    {formatFoodUnit(planner.scheduleDraft.food.unit)}
                  </Text>
                </View>
                <Text style={styles.quantityHint}>
                  Còn {formatFoodAmount(planner.scheduleDraft.food.quantity, planner.scheduleDraft.food.unit)} trong kho.
                </Text>
              </View>
            ) : null}
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
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScheduleDayRolloverModal
        prompt={planner.scheduleRolloverPrompt}
        onAccept={planner.handleAcceptScheduleRollover}
        onCancel={planner.handleCancelScheduleRollover}
      />

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
                ? `"${planner.missingIngredientPrompt.sourceName}" còn thiếu vài nguyên liệu. Bạn có muốn thêm vào danh sách mua để bổ sung không?`
                : "Bạn có muốn thêm các nguyên liệu thiếu vào danh sách mua không?"}
            </Text>
            <View style={styles.noticeList}>
              {planner.missingIngredientPrompt?.items.map((item, index) => (
                <View
                  key={`${item.ingredientName}-${item.unit}-${index}`}
                  style={styles.noticeItemRow}
                >
                  <MaterialCommunityIcons name="plus-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.noticeItemText}>
                    {item.ingredientName} - {formatFoodAmount(item.quantity, item.unit)}
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
                <Text style={styles.noticePrimaryButtonText}>Thêm vào danh sách mua</Text>
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
