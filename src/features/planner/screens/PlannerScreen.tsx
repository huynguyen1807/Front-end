import { ActivityIndicator, Platform, RefreshControl, ScrollView, Text, View } from "react-native";
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

  const renderPlannerTab = () => {
    if (planner.detailTab === "inventory") {
      return (
        <Section
          title="Inventory-based suggestions"
          subtitle="Ưu tiên thực phẩm sắp hết hạn, sau đó ghép với recipe phù hợp để giảm lãng phí."
        >
          <InventoryBucket
            title="Sắp hết hạn"
            tone="warning"
            foods={planner.inventoryBuckets.nearExpiry}
          />
          <InventoryBucket title="Còn tốt" tone="safe" foods={planner.inventoryBuckets.safe} />
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
              targetCalories={planner.targetCalories}
              selectedMealTypes={planner.selectedMealTypes}
              generatedResult={planner.generatedResult}
              saving={planner.saving}
              onChangeTargetCalories={planner.setTargetCalories}
              onToggleMealType={planner.toggleMealType}
              onGenerate={planner.handleGenerateDailyPlan}
            />

            <Section
              title="Recommended Recipes"
              subtitle="AI tạo recipe từ inventory, ưu tiên thực phẩm sắp hết hạn, kcal mục tiêu và sở thích."
            >
              <View style={styles.segmentRow}>
                {mealTypeOptions.map((option) => (
                  <ChipButton
                    key={option.key}
                    label={option.label}
                    active={planner.selectedMealType === option.key}
                    onPress={() => planner.setSelectedMealType(option.key)}
                  />
                ))}
              </View>
              {planner.loading ? (
                <ActivityIndicator color={COLORS.primary} style={styles.loader} />
              ) : planner.recipes.length === 0 ? (
                <Text style={styles.emptyText}>
                  Chưa có recipe gợi ý. Bấm Generate plan để AI tạo recipe từ inventory.
                </Text>
              ) : (
                planner.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe._id}
                    recipe={recipe}
                    onAddToPlan={planner.handleAddRecipeToPlan}
                  />
                ))
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
      <BottomNavbar />
    </ScreenContainer>
  );
}
