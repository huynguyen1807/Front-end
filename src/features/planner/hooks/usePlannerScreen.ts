import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import {
  AdminSection,
  CalorieGoalKey,
  PlannerDetailTab,
  Workspace,
  calorieGoalOptions,
  createEmptyRecipeForm,
  createEmptyRecipeIngredient,
  emptyCategoryForm,
  emptyFactForm,
  emptyStorageRuleForm,
  mealTypeOptions,
  nextStatus,
  CategoryFormState,
  NutritionFactFormState,
  RecipeFormState,
  StorageRuleFormState,
} from "../constants/plannerConstants";
import {
  getAdminAiGeneratedDataApi,
  getAdminFoodCategoriesApi,
  getAdminStorageRulesApi,
  createAdminFoodCategoryApi,
  createAdminStorageRuleApi,
  deleteAdminFoodCategoryApi,
  deleteAdminStorageRuleApi,
  reviewAdminAiGeneratedDataApi,
  updateAdminFoodCategoryApi,
  updateAdminStorageRuleApi,
} from "../../adminData/services/adminDataApi";
import {
  calculateNutritionApi,
  createAdminNutritionFactApi,
  deleteAdminNutritionFactApi,
  getAdminNutritionFactsApi,
  getNutritionReportApi,
  updateAdminNutritionFactApi,
} from "../../nutrition/services/nutritionApi";
import {
  createAdminRecipeApi,
  deleteAdminRecipeApi,
  getAdminRecipesApi,
  updateAdminRecipeApi,
} from "../../recipes/services/recipeAdminApi";
import {
  createUserRecipeApi,
  deleteUserRecipeApi,
  getUserRecipesApi,
  updateUserRecipeApi,
} from "../../recipes/services/userRecipeApi";
import {
  createMealPlanApi,
  deleteMealPlanApi,
  extractRecipeFromVideoApi,
  addMissingIngredientsToShoppingListApi,
  generateDailyMealPlanApi,
  getAvailableFoodsApi,
  getMealPlansApi,
  getRecipesApi,
  updateMealPlanApi,
  updateUserPreferencesApi,
} from "../services/plannerApi";
import {
  AiGeneratedData,
  FoodCategoryData,
  GeneratedMealPlanResult,
  InventoryFood,
  MealRecommendation,
  MealPlan,
  MealPlanMeal,
  MealType,
  NutritionCalculation,
  NutritionFact,
  NutritionReport,
  Recipe,
  RecipeAvailabilityStatus,
  ScheduleDate,
  StorageRuleData,
  VideoRecipeExtraction,
} from "../types/planner";
import {
  addDays,
  getDaysUntilExpiry,
  getErrorMessage,
  getRecipeAvailability,
  getRecipeUsedFoodIds,
  normalizeMealForApi,
  toDateInput,
} from "../utils/plannerUtils";

const mapRecipeIngredientsToForm = (recipe: Recipe) => {
  if (!recipe.ingredients?.length) {
    return [createEmptyRecipeIngredient()];
  }

  return recipe.ingredients.map((ingredient, index) => ({
    id: `${recipe._id}-${index}`,
    ingredientName: ingredient.ingredientName || "",
    quantity:
      ingredient.quantity === undefined || ingredient.quantity === null
        ? ""
        : String(ingredient.quantity),
    unit: ingredient.unit || "g",
    isRequired: ingredient.isRequired !== false,
  }));
};

const mapRecipeToForm = (recipe: Recipe): RecipeFormState => {
  const firstIngredient = recipe.ingredients?.[0];

  return {
    id: recipe._id,
    recipeName: recipe.recipeName,
    description: recipe.description || "",
    imageUrl: recipe.imageUrl || "",
    cookingSteps: recipe.cookingSteps || [],
    newCookingStep: "",
    cookingTime: recipe.cookingTime ? String(recipe.cookingTime) : "",
    difficulty: recipe.difficulty || "EASY",
    calories: recipe.calories ? String(recipe.calories) : "",
    protein: recipe.macroSummary?.protein ? String(recipe.macroSummary.protein) : "",
    carbs: recipe.macroSummary?.carbs ? String(recipe.macroSummary.carbs) : "",
    fat: recipe.macroSummary?.fat ? String(recipe.macroSummary.fat) : "",
    tags: recipe.tags?.join(", ") || "",
    ingredients: mapRecipeIngredientsToForm(recipe),
    ingredientName: firstIngredient?.ingredientName || "",
    ingredientQuantity: firstIngredient?.quantity ? String(firstIngredient.quantity) : "",
    ingredientUnit: firstIngredient?.unit || "g",
  };
};

const buildIngredientsFromForm = (formState: RecipeFormState) => {
  const ingredientRows = (formState.ingredients || [])
    .map((ingredient) => ({
      ingredientName: ingredient.ingredientName.trim(),
      quantity: Number(ingredient.quantity) || 1,
      unit: ingredient.unit.trim() || "g",
      isRequired: ingredient.isRequired !== false,
    }))
    .filter((ingredient) => ingredient.ingredientName);

  if (ingredientRows.length) {
    return ingredientRows;
  }

  return formState.ingredientName.trim()
    ? [
        {
          ingredientName: formState.ingredientName.trim(),
          quantity: Number(formState.ingredientQuantity) || 1,
          unit: formState.ingredientUnit || "g",
          isRequired: true,
        },
      ]
    : [];
};

const buildCookingStepsFromForm = (formState: RecipeFormState) => {
  const steps = (formState.cookingSteps || [])
    .map((step) => step.trim())
    .filter(Boolean);
  const draftStep = formState.newCookingStep.trim();

  return draftStep ? [...steps, draftStep] : steps;
};

const getFoodCalories = (food: InventoryFood) =>
  Number(food.calories ?? food.nutrition?.calories) || 0;

const getFoodMacroSummary = (food: InventoryFood) => ({
  protein: Number(food.macroSummary?.protein ?? food.nutrition?.macroSummary.protein) || 0,
  carbs: Number(food.macroSummary?.carbs ?? food.nutrition?.macroSummary.carbs) || 0,
  fat: Number(food.macroSummary?.fat ?? food.nutrition?.macroSummary.fat) || 0,
});

const buildMissingShoppingItems = (
  recipe: Recipe,
  missingIngredientNames: string[] = []
): MissingShoppingItem[] => {
  const missingSet = new Set(missingIngredientNames.map((name) => name.trim().toLowerCase()));
  const sourceIngredients = recipe.missingIngredients?.length
    ? recipe.missingIngredients
    : recipe.ingredients || [];

  return sourceIngredients
    .filter(
      (ingredient) =>
        missingSet.size === 0 ||
        missingSet.has(ingredient.ingredientName.trim().toLowerCase())
    )
    .map((ingredient) => ({
      ingredientName: ingredient.ingredientName,
      categoryId: typeof ingredient.categoryId === "string" ? ingredient.categoryId : undefined,
      quantity: Number(ingredient.quantity) || 1,
      unit: ingredient.unit || "item",
    }));
};

type ScheduleDraft =
  | { type: "recipe"; recipe: Recipe }
  | { type: "food"; food: InventoryFood }
  | null;

type MissingShoppingItem = {
  ingredientName: string;
  categoryId?: string;
  quantity: number;
  unit: string;
};

type RecommendationTabKey = "all" | "enough" | "missing";

const emptyRecommendationBadges: Record<RecommendationTabKey, boolean> = {
  all: false,
  enough: false,
  missing: false,
};

const normalizeRecipeName = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getRecommendationKey = (recipe: Recipe) =>
  recipe._id || `${normalizeRecipeName(recipe.recipeName)}-${recipe.sourceType || "recipe"}`;

const getCalorieGoalKeyForTarget = (target: number) => {
  const option = calorieGoalOptions.find(
    (item) => target >= item.min && (item.max === undefined || target <= item.max)
  );
  return option?.key || "OVER_2000";
};

const getMissingRecipeIngredients = (recipe: Recipe, missingNames: string[]) => {
  const missingSet = new Set(missingNames.map((name) => normalizeRecipeName(name)));
  const matchedRows = (recipe.ingredients || []).filter((ingredient) =>
    missingSet.has(normalizeRecipeName(ingredient.ingredientName))
  );

  if (matchedRows.length) {
    return matchedRows;
  }

  return (recipe.missingIngredients || []).length ? recipe.missingIngredients || [] : [];
};

const decorateRecommendation = (
  item: MealRecommendation,
  foodList: InventoryFood[]
): MealRecommendation => {
  const availability = getRecipeAvailability(item.recipe, foodList);
  const status: RecipeAvailabilityStatus = availability.canSchedule
    ? "ENOUGH_INGREDIENTS"
    : "MISSING_INGREDIENTS";
  const missingIngredients =
    status === "MISSING_INGREDIENTS"
      ? getMissingRecipeIngredients(item.recipe, availability.missingIngredients)
      : [];

  return {
    ...item,
    availabilityStatus: status,
    missingIngredients,
    recipe: {
      ...item.recipe,
      availability,
      availabilityStatus: status,
      missingIngredients,
    },
  };
};

const buildRecipeRecommendation = (recipe: Recipe, foodList: InventoryFood[]) =>
  decorateRecommendation(
    {
      recipe,
      score: 1,
      matchedFoods: [],
      priorityReasons: [],
    },
    foodList
  );

const mergeRecommendations = (
  primary: MealRecommendation[],
  secondary: MealRecommendation[] = []
) => {
  const map = new Map<string, MealRecommendation>();

  [...primary, ...secondary].forEach((item) => {
    const recipe = item.recipe;
    if (!recipe || recipe.isActive === false) return;

    const key = getRecommendationKey(recipe);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
};

export default function usePlannerScreen() {
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>("meal");
  const [detailTab, setDetailTab] = useState<PlannerDetailTab>("inventory");
  const [adminSection, setAdminSection] = useState<AdminSection>("category");

  const [activeDate, setActiveDate] = useState(toDateInput(new Date()));
  const activeDateRef = useRef(activeDate);
  const hiddenRecommendationKeysRef = useRef(new Set<string>());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [foods, setFoods] = useState<InventoryFood[]>([]);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedMealPlanResult | null>(null);
  const [recommendedItems, setRecommendedItems] = useState<MealRecommendation[]>([]);
  const [recommendationBadges, setRecommendationBadges] =
    useState<Record<RecommendationTabKey, boolean>>(emptyRecommendationBadges);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoExtraction, setVideoExtraction] = useState<VideoRecipeExtraction | null>(null);
  const [selectedCalorieGoal, setSelectedCalorieGoal] =
    useState<CalorieGoalKey>("RANGE_1000_1500");
  const [dailyTargetCalories, setDailyTargetCalories] = useState(calorieGoalOptions[3].target);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(String(calorieGoalOptions[3].target));
  const [dailyGoalModalVisible, setDailyGoalModalVisible] = useState(false);
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([
    "BREAKFAST",
    "LUNCH",
    "DINNER",
  ]);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(null);
  const [scheduleMealType, setScheduleMealType] = useState<MealType>("BREAKFAST");
  const [scheduleTime, setScheduleTime] = useState(mealTypeOptions[0].time);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");
  const [missingIngredientPrompt, setMissingIngredientPrompt] = useState<{
    sourceName: string;
    items: MissingShoppingItem[];
  } | null>(null);

  const [adminRecipes, setAdminRecipes] = useState<Recipe[]>([]);
  const [nutritionFacts, setNutritionFacts] = useState<NutritionFact[]>([]);
  const [categories, setCategories] = useState<FoodCategoryData[]>([]);
  const [storageRules, setStorageRules] = useState<StorageRuleData[]>([]);
  const [aiReviewItems, setAiReviewItems] = useState<AiGeneratedData[]>([]);

  const [recipeForm, setRecipeForm] = useState<RecipeFormState>(() => createEmptyRecipeForm());
  const [userRecipeForm, setUserRecipeForm] = useState<RecipeFormState>(() =>
    createEmptyRecipeForm()
  );
  const [factForm, setFactForm] = useState<NutritionFactFormState>(emptyFactForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [storageRuleForm, setStorageRuleForm] =
    useState<StorageRuleFormState>(emptyStorageRuleForm);
  const [calculation, setCalculation] = useState<NutritionCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dates = useMemo<ScheduleDate[]>(() => {
    const today = new Date();
    return Array.from({ length: 5 }, (_, index) => {
      const date = addDays(today, index);
      return {
        id: toDateInput(date),
        value: toDateInput(date),
        label:
          index === 0
            ? "Hôm nay"
            : date.toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "2-digit",
              }),
      };
    });
  }, []);

  const selectedCalorieGoalOption = useMemo(
    () =>
      calorieGoalOptions.find((option) => option.key === selectedCalorieGoal) ||
      calorieGoalOptions[3],
    [selectedCalorieGoal]
  );

  const dayTotals = useMemo(() => {
    return plans.reduce(
      (acc, plan) => {
        const mealTotals = (plan.meals || []).reduce(
          (mealAcc, meal) => {
            mealAcc.calories += Number(meal.calories) || 0;
            mealAcc.macroSummary.protein += Number(meal.macroSummary?.protein) || 0;
            mealAcc.macroSummary.carbs += Number(meal.macroSummary?.carbs) || 0;
            mealAcc.macroSummary.fat += Number(meal.macroSummary?.fat) || 0;
            return mealAcc;
          },
          { calories: 0, macroSummary: { protein: 0, carbs: 0, fat: 0 } }
        );

        acc.calories += mealTotals.calories || Number(plan.totalCalories) || 0;
        acc.macroSummary.protein += mealTotals.macroSummary.protein || Number(plan.macroSummary?.protein) || 0;
        acc.macroSummary.carbs += mealTotals.macroSummary.carbs || Number(plan.macroSummary?.carbs) || 0;
        acc.macroSummary.fat += mealTotals.macroSummary.fat || Number(plan.macroSummary?.fat) || 0;
        return acc;
      },
      { calories: 0, macroSummary: { protein: 0, carbs: 0, fat: 0 } }
    );
  }, [plans]);

  const inventoryBuckets = useMemo(() => {
    const available = foods.filter(
      (food) => food.status !== "EXPIRED" && Number(food.quantity) > 0
    );
    return {
      nearExpiry: available
        .filter(
          (food) =>
            food.status === "NEAR_EXPIRY" || getDaysUntilExpiry(food.expiryDate) <= 3
        )
        .sort(
          (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
        ),
      safe: available
        .filter((food) => food.status === "SAFE" && getDaysUntilExpiry(food.expiryDate) > 3)
        .sort(
          (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
        ),
    };
  }, [foods]);

  const userRecipeAvailability = useMemo(() => {
    return userRecipes.reduce<Record<string, ReturnType<typeof getRecipeAvailability>>>(
      (acc, recipe) => {
        acc[recipe._id] = getRecipeAvailability(recipe, foods);
        return acc;
      },
      {}
    );
  }, [foods, userRecipes]);

  const loadAdminData = useCallback(async () => {
    const [recipeList, factList, categoryList, storageRuleList, reviewList] =
      await Promise.all([
        getAdminRecipesApi(),
        getAdminNutritionFactsApi(),
        getAdminFoodCategoriesApi(),
        getAdminStorageRulesApi(),
        getAdminAiGeneratedDataApi(),
      ]);

    setAdminRecipes(recipeList);
    setNutritionFacts(factList);
    setCategories(categoryList);
    setStorageRules(storageRuleList);
    setAiReviewItems(reviewList);
  }, []);

  const loadPlanner = useCallback(async (options?: { date?: string; showLoading?: boolean }) => {
    if (!roleLoaded) return;

    const planDate = options?.date || activeDateRef.current;
    const shouldShowLoading = options?.showLoading !== false;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      const [recipeList, userRecipeList, planList, macroReport, foodList] = await Promise.all([
        getRecipesApi(),
        getUserRecipesApi(),
        getMealPlansApi({ date: planDate }),
        getNutritionReportApi({ periodType: "WEEK", startDate: planDate }),
        getAvailableFoodsApi(),
      ]);

      const activeRecipes = recipeList.filter(
        (recipe) => recipe.isActive !== false && recipe.sourceType !== "USER_CREATED"
      );

      setRecipes(activeRecipes);
      setUserRecipes(userRecipeList.filter(
        (recipe) => recipe.isActive !== false && recipe.sourceType === "USER_CREATED"
      ));
      setPlans(planList);
      setReport(macroReport);
      setFoods(foodList);
      setRecommendedItems((current) => {
        const refreshedCurrent = current.map((item) => decorateRecommendation(item, foodList));
        const baseRecommendations = activeRecipes.map((recipe) =>
          buildRecipeRecommendation(recipe, foodList)
        );

        return mergeRecommendations(refreshedCurrent, baseRecommendations).filter(
          (item) => !hiddenRecommendationKeysRef.current.has(getRecommendationKey(item.recipe))
        );
      });

      if (isAdmin) {
        await loadAdminData();
      }
    } catch (error: any) {
      Alert.alert("Không tải được Meal Planner", getErrorMessage(error));
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [isAdmin, loadAdminData, roleLoaded]);

  useEffect(() => {
    activeDateRef.current = activeDate;
  }, [activeDate]);

  useEffect(() => {
    const loadRole = async () => {
      const raw = await AsyncStorage.getItem("userInfo");
      if (raw) {
        const userInfo = JSON.parse(raw);
        setIsAdmin(userInfo?.role === "ADMIN");
        const storedTarget = Number(userInfo?.preferences?.calorieTarget);
        if (storedTarget > 0) {
          setDailyTargetCalories(storedTarget);
          setDailyGoalDraft(String(storedTarget));
          setSelectedCalorieGoal(getCalorieGoalKeyForTarget(storedTarget));
        }
      }
      setRoleLoaded(true);
    };

    loadRole().catch(() => setRoleLoaded(true));
  }, []);

  useEffect(() => {
    loadPlanner();
  }, [loadPlanner]);

  useEffect(() => {
    if (!isAdmin && workspace === "admin") {
      setWorkspace("meal");
    }
  }, [isAdmin, workspace]);

  const handleChangeActiveDate = useCallback(
    (date: string) => {
      activeDateRef.current = date;
      setActiveDate(date);
      void loadPlanner({ date, showLoading: false });
    },
    [loadPlanner]
  );

  const handleSelectCalorieGoal = (goalKey: CalorieGoalKey) => {
    const option =
      calorieGoalOptions.find((item) => item.key === goalKey) || calorieGoalOptions[3];
    setSelectedCalorieGoal(goalKey);
    setDailyTargetCalories(option.target);
    setDailyGoalDraft(String(option.target));
  };

  const toggleMealType = (mealType: MealType) => {
    setSelectedMealTypes((current) => {
      if (current.includes(mealType)) {
        return current.length === 1 ? current : current.filter((item) => item !== mealType);
      }
      return [...current, mealType];
    });
  };

  const openDailyGoalEditor = () => {
    setDailyGoalDraft(String(dailyTargetCalories));
    setDailyGoalModalVisible(true);
  };

  const closeDailyGoalEditor = () => {
    setDailyGoalDraft(String(dailyTargetCalories));
    setDailyGoalModalVisible(false);
  };

  const handleSaveDailyGoal = async () => {
    const nextTarget = Number(dailyGoalDraft);
    if (!Number.isFinite(nextTarget) || nextTarget <= 0) {
      Alert.alert("Mục tiêu kcal không hợp lệ", "Nhập số kcal lớn hơn 0.");
      return;
    }

    try {
      setSaving(true);
      await updateUserPreferencesApi({ calorieTarget: nextTarget });
      setDailyTargetCalories(nextTarget);
      setSelectedCalorieGoal(getCalorieGoalKeyForTarget(nextTarget));
      setDailyGoalModalVisible(false);
    } catch (error: any) {
      Alert.alert("Không lưu được mục tiêu kcal", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const markRecommendationTabSeen = (tab: RecommendationTabKey) => {
    setRecommendationBadges((current) => ({ ...current, [tab]: false }));
  };

  const handleDismissRecommendation = (recipe: Recipe) => {
    const key = getRecommendationKey(recipe);
    hiddenRecommendationKeysRef.current.add(key);
    setRecommendedItems((current) =>
      current.filter((item) => getRecommendationKey(item.recipe) !== key)
    );
  };

  const handleGenerateDailyPlan = async () => {
    try {
      setSaving(true);
      const result = await generateDailyMealPlanApi({
        planDate: activeDate,
        calorieTarget: dailyTargetCalories,
        calorieMin: selectedCalorieGoalOption.min,
        calorieMax: selectedCalorieGoalOption.max,
        mealTypes: selectedMealTypes,
      });
      setGeneratedResult(result);
      const rawRecommendations: MealRecommendation[] = [
        ...(result.recommendations || []),
        ...(result.generatedRecipes || []).map((recipe) => ({
          recipe,
          score: 1,
          matchedFoods: [],
          priorityReasons: [],
        })),
      ];
      const nextRecommendations = mergeRecommendations(
        rawRecommendations.map((item) => decorateRecommendation(item, foods))
      );

      setRecommendedItems((current) => {
        return mergeRecommendations(nextRecommendations, current).filter(
          (item) => !hiddenRecommendationKeysRef.current.has(getRecommendationKey(item.recipe))
        );
      });
      setRecommendationBadges({
        all: nextRecommendations.length > 0,
        enough: nextRecommendations.some(
          (item) => item.availabilityStatus === "ENOUGH_INGREDIENTS"
        ),
        missing: nextRecommendations.some(
          (item) => item.availabilityStatus === "MISSING_INGREDIENTS"
        ),
      });
    } catch (error: any) {
      Alert.alert("Không tạo được meal plan", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleExtractVideo = async () => {
    if (!videoUrl.trim()) {
      Alert.alert("Thiếu video link", "Dán link video trước khi extract recipe.");
      return;
    }

    try {
      setSaving(true);
      const result = await extractRecipeFromVideoApi({ videoUrl: videoUrl.trim() });
      setVideoExtraction(result);
      setVideoUrl("");
    } catch (error: any) {
      Alert.alert("Không extract được recipe", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openScheduleDraft = (draft: Exclude<ScheduleDraft, null>) => {
    const defaultOption = mealTypeOptions[0];
    setScheduleDraft(draft);
    setScheduleMealType(defaultOption.key);
    setScheduleTime(defaultOption.time);
  };

  const handleSelectScheduleMealType = (mealType: MealType) => {
    const option = mealTypeOptions.find((item) => item.key === mealType) || mealTypeOptions[0];
    setScheduleMealType(option.key);
    setScheduleTime(option.time);
  };

  const closeScheduleModal = () => {
    setScheduleDraft(null);
  };

  const saveMealToPlan = async (meal: MealPlanMeal) => {
    if (plans[0]) {
      await updateMealPlanApi(plans[0]._id, {
        planDate: activeDate,
        meals: [...plans[0].meals.map(normalizeMealForApi), meal],
      });
    } else {
      await createMealPlanApi({
        planDate: activeDate,
        goal: "Balanced daily meals",
        meals: [meal],
      });
    }
  };

  const handleConfirmScheduleMeal = async () => {
    if (!scheduleDraft) return;

    try {
      setSaving(true);
      if (scheduleDraft.type === "recipe") {
        const { recipe } = scheduleDraft;
        await saveMealToPlan({
          mealType: scheduleMealType,
          recipeId: recipe._id,
          recipeName: recipe.recipeName,
          imageUrl: recipe.imageUrl,
          scheduledTime: scheduleTime,
          calories: recipe.calories || 0,
          macroSummary: recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 },
          status: "PENDING",
          usedFoodItemIds: getRecipeUsedFoodIds(recipe, foods),
        });
      } else {
        const { food } = scheduleDraft;
        await saveMealToPlan({
          mealType: scheduleMealType,
          recipeName: food.foodName,
          imageUrl: food.imageUrl,
          scheduledTime: scheduleTime,
          calories: getFoodCalories(food),
          macroSummary: getFoodMacroSummary(food),
          status: "PENDING",
          usedFoodItemIds: [food._id],
        });
      }

      closeScheduleModal();
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không thêm được meal", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const closeMissingIngredientPrompt = () => {
    setMissingIngredientPrompt(null);
  };

  const handleAddMissingIngredientsToShoppingList = async () => {
    if (!missingIngredientPrompt?.items.length) return;

    try {
      setSaving(true);
      await addMissingIngredientsToShoppingListApi(missingIngredientPrompt.items);
      setMissingIngredientPrompt(null);
    } catch (error: any) {
      Alert.alert("Không thêm được shopping list", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePromptRecipeMissingIngredients = (recipe: Recipe) => {
    const availability = getRecipeAvailability(recipe, foods);
    const items = buildMissingShoppingItems(recipe, availability.missingIngredients);

    if (!items.length) {
      Alert.alert("Đủ nguyên liệu", "Recipe này hiện không có nguyên liệu thiếu cần thêm vào shopping list.");
      return;
    }

    setMissingIngredientPrompt({
      sourceName: recipe.recipeName,
      items,
    });
  };

  const handleAddRecipeToPlan = async (recipe: Recipe) => {
    const availability = getRecipeAvailability(recipe, foods);
    if (!availability.canSchedule) {
      setMissingIngredientPrompt({
        sourceName: recipe.recipeName,
        items: buildMissingShoppingItems(recipe, availability.missingIngredients),
      });
      return;
    }

    openScheduleDraft({ type: "recipe", recipe });
    return;

    try {
      setSaving(true);
      const option =
        mealTypeOptions.find((item) => item.key === selectedMealType) || mealTypeOptions[1];
      const meal: MealPlanMeal = {
        mealType: selectedMealType,
        recipeId: recipe._id,
        recipeName: recipe.recipeName,
        imageUrl: recipe.imageUrl,
        scheduledTime: option.time,
        calories: recipe.calories || 0,
        macroSummary: recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 },
        status: "PENDING",
        usedFoodItemIds: getRecipeUsedFoodIds(recipe, foods),
      };

      if (plans[0]) {
        await updateMealPlanApi(plans[0]._id, {
          planDate: activeDate,
          meals: [...plans[0].meals.map(normalizeMealForApi), meal],
        });
      } else {
        await createMealPlanApi({
          planDate: activeDate,
          goal: "Balanced daily meals",
          meals: [meal],
        });
      }

      setDetailTab("schedule");
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không thêm được meal", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAddFoodToPlan = async (food: InventoryFood) => {
    if (Number(food.quantity) <= 0 || food.status === "EXPIRED") {
      setMissingIngredientPrompt({
        sourceName: food.foodName,
        items: [
          {
            ingredientName: food.foodName,
            categoryId: typeof food.categoryId === "string" ? food.categoryId : undefined,
            quantity: 1,
            unit: food.unit || "item",
          },
        ],
      });
      return;
    }

    openScheduleDraft({ type: "food", food });
    return;

    try {
      setSaving(true);
      const option =
        mealTypeOptions.find((item) => item.key === selectedMealType) || mealTypeOptions[1];
      const meal: MealPlanMeal = {
        mealType: selectedMealType,
        recipeName: food.foodName,
        imageUrl: food.imageUrl,
        scheduledTime: option.time,
        calories: getFoodCalories(food),
        macroSummary: getFoodMacroSummary(food),
        status: "PENDING",
        usedFoodItemIds: [food._id],
      };

      if (plans[0]) {
        await updateMealPlanApi(plans[0]._id, {
          planDate: activeDate,
          meals: [...plans[0].meals.map(normalizeMealForApi), meal],
        });
      } else {
        await createMealPlanApi({
          planDate: activeDate,
          goal: "Balanced daily meals",
          meals: [meal],
        });
      }

      setDetailTab("schedule");
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không thêm được thực phẩm", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCycleMealStatus = async (plan: MealPlan, mealIndex: number) => {
    try {
      const meals = plan.meals.map((meal, index) =>
        index === mealIndex
          ? { ...normalizeMealForApi(meal), status: nextStatus[meal.status] }
          : normalizeMealForApi(meal)
      );
      await updateMealPlanApi(plan._id, { planDate: activeDate, meals });
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không cập nhật được meal", getErrorMessage(error));
    }
  };

  const handleRemoveMeal = async (plan: MealPlan, mealIndex: number) => {
    try {
      const meals = plan.meals
        .filter((_, index) => index !== mealIndex)
        .map(normalizeMealForApi);
      await updateMealPlanApi(plan._id, { planDate: activeDate, meals });
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không xóa được meal", getErrorMessage(error));
    }
  };

  const handleDeletePlan = (plan: MealPlan) => {
    Alert.alert("Xóa meal plan", "Xóa toàn bộ meal plan ngày này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMealPlanApi(plan._id);
            await loadPlanner({ showLoading: false });
          } catch (error: any) {
            Alert.alert("Không xóa được meal plan", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const resetRecipeForm = () => {
    setRecipeForm(createEmptyRecipeForm());
    setCalculation(null);
  };

  const fillRecipeForm = (recipe: Recipe) => {
    setRecipeForm(mapRecipeToForm(recipe));
    setAdminSection("recipe");
  };

  const fillUserRecipeForm = (recipe: Recipe) => {
    setUserRecipeForm(mapRecipeToForm(recipe));
  };

  const buildRecipePayloadFromForm = (
    formState: RecipeFormState,
    sourceType?: "SYSTEM" | "USER_CREATED"
  ) => {
    const ingredients = buildIngredientsFromForm(formState);

    return {
      recipeName: formState.recipeName.trim(),
      description: formState.description.trim() || undefined,
      imageUrl: formState.imageUrl.trim() || undefined,
      cookingSteps: buildCookingStepsFromForm(formState),
      cookingTime: formState.cookingTime ? Number(formState.cookingTime) : undefined,
      difficulty: formState.difficulty,
      calories: formState.calories ? Number(formState.calories) : undefined,
      macroSummary: {
        protein: Number(formState.protein) || 0,
        carbs: Number(formState.carbs) || 0,
        fat: Number(formState.fat) || 0,
      },
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients,
      ...(sourceType ? { sourceType } : {}),
      recalculateNutrition: Boolean(ingredients.length && !formState.calories),
    };
  };

  const buildRecipePayload = () => buildRecipePayloadFromForm(recipeForm, "SYSTEM");
  const buildUserRecipePayload = () => buildRecipePayloadFromForm(userRecipeForm);

  const buildRecipePayloadFromRecipe = (recipe: Recipe) => ({
    recipeName: recipe.recipeName.trim(),
    description: recipe.description?.trim() || undefined,
    imageUrl: recipe.imageUrl?.trim() || undefined,
    cookingSteps: recipe.cookingSteps || [],
    cookingTime: recipe.cookingTime,
    difficulty: recipe.difficulty || "EASY",
    calories: recipe.calories,
    macroSummary: recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 },
    tags: recipe.tags || [],
    ingredients: recipe.ingredients || [],
    recalculateNutrition: false,
  });

  const handleSaveRecommendedRecipe = async (recipe: Recipe) => {
    const recipeName = normalizeRecipeName(recipe.recipeName);
    const alreadySaved = userRecipes.some(
      (item) => normalizeRecipeName(item.recipeName) === recipeName
    );

    if (alreadySaved) {
      Alert.alert("Recipe đã có", "Recipe này đã nằm trong danh sách recipe cá nhân.");
      return;
    }

    try {
      setSaving(true);
      await createUserRecipeApi(buildRecipePayloadFromRecipe(recipe));
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không thêm được recipe", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateRecipeNutrition = async () => {
    const ingredients = buildIngredientsFromForm(recipeForm);

    if (!ingredients.length) {
      Alert.alert(
        "Thiếu nguyên liệu",
        "Nhập ít nhất một nguyên liệu để tính calories/macros."
      );
      return;
    }

    try {
      const result = await calculateNutritionApi(ingredients);
      setCalculation(result);
      setRecipeForm((form) => ({
        ...form,
        calories: result.calories ? String(result.calories) : form.calories,
        protein: result.macroSummary.protein ? String(result.macroSummary.protein) : form.protein,
        carbs: result.macroSummary.carbs ? String(result.macroSummary.carbs) : form.carbs,
        fat: result.macroSummary.fat ? String(result.macroSummary.fat) : form.fat,
      }));
    } catch (error: any) {
      Alert.alert("Không tính được dinh dưỡng", getErrorMessage(error));
    }
  };

  const handleSaveRecipe = async () => {
    if (!isAdmin) return;
    if (!recipeForm.recipeName.trim()) {
      Alert.alert("Thiếu tên recipe", "Vui lòng nhập tên công thức.");
      return;
    }

    try {
      setSaving(true);
      const payload = buildRecipePayload();
      if (recipeForm.id) {
        await updateAdminRecipeApi(recipeForm.id, payload);
      } else {
        await createAdminRecipeApi(payload);
      }
      resetRecipeForm();
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không lưu được recipe", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserRecipe = async () => {
    if (!userRecipeForm.recipeName.trim()) {
      Alert.alert("Thiếu tên recipe", "Vui lòng nhập tên công thức.");
      return false;
    }

    try {
      setSaving(true);
      const payload = buildUserRecipePayload();
      if (userRecipeForm.id) {
        await updateUserRecipeApi(userRecipeForm.id, payload);
      } else {
        await createUserRecipeApi(payload);
      }
      setUserRecipeForm(createEmptyRecipeForm());
      await loadPlanner();
      return true;
    } catch (error: any) {
      Alert.alert("Không lưu được recipe cá nhân", getErrorMessage(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUserRecipe = (recipe: Recipe) => {
    Alert.alert("Xóa recipe", `Xóa "${recipe.recipeName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUserRecipeApi(recipe._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được recipe", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    if (!isAdmin) return;
    Alert.alert("Xóa recipe", `Xóa "${recipe.recipeName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminRecipeApi(recipe._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được recipe", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.categoryName.trim()) {
      Alert.alert("Thiếu category", "Nhập tên food category.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        categoryName: categoryForm.categoryName.trim(),
        description: categoryForm.description.trim() || undefined,
      };
      if (categoryForm.id) {
        await updateAdminFoodCategoryApi(categoryForm.id, payload);
      } else {
        await createAdminFoodCategoryApi(payload);
      }
      setCategoryForm(emptyCategoryForm);
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không lưu được category", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = (category: FoodCategoryData) => {
    Alert.alert("Ẩn category", `Ẩn "${category.categoryName}" khỏi hệ thống?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Ẩn",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminFoodCategoryApi(category._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không ẩn được category", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleSaveStorageRule = async () => {
    if (!storageRuleForm.categoryName.trim() || !storageRuleForm.estimatedDays) {
      Alert.alert("Thiếu storage rule", "Nhập category và số ngày bảo quản.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        categoryName: storageRuleForm.categoryName.trim(),
        storageType: storageRuleForm.storageType,
        estimatedDays: Number(storageRuleForm.estimatedDays),
        instruction: storageRuleForm.instruction.trim() || undefined,
        warningMessage: storageRuleForm.warningMessage.trim() || undefined,
        priority: Number(storageRuleForm.priority) || 0,
        source: "ADMIN" as const,
        status: "OFFICIAL" as const,
      };

      if (storageRuleForm.id) {
        await updateAdminStorageRuleApi(storageRuleForm.id, payload);
      } else {
        await createAdminStorageRuleApi(payload);
      }
      setStorageRuleForm(emptyStorageRuleForm);
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không lưu được storage rule", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStorageRule = (rule: StorageRuleData) => {
    Alert.alert("Xóa storage rule", "Xóa rule bảo quản này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminStorageRuleApi(rule._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được storage rule", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleSaveNutritionFact = async () => {
    if (!factForm.foodName.trim() || !factForm.categoryName.trim() || !factForm.caloriesPerUnit) {
      Alert.alert("Thiếu nutrition data", "Nhập tên thực phẩm, nhóm và calories per unit.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        foodName: factForm.foodName.trim(),
        categoryName: factForm.categoryName.trim(),
        caloriesPerUnit: Number(factForm.caloriesPerUnit),
        unit: factForm.unit,
        protein: Number(factForm.protein) || 0,
        carbs: Number(factForm.carbs) || 0,
        fat: Number(factForm.fat) || 0,
        source: "ADMIN" as const,
        status: "OFFICIAL" as const,
      };

      if (factForm.id) {
        await updateAdminNutritionFactApi(factForm.id, payload);
      } else {
        await createAdminNutritionFactApi(payload);
      }
      setFactForm(emptyFactForm);
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không lưu được nutrition data", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNutritionFact = (fact: NutritionFact) => {
    Alert.alert("Xóa nutrition data", `Xóa "${fact.foodName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminNutritionFactApi(fact._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được nutrition data", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleReviewAiData = async (item: AiGeneratedData, action: "APPROVE" | "REJECT") => {
    try {
      setSaving(true);
      await reviewAdminAiGeneratedDataApi(item._id, { action });
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không review được AI data", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return {
    roleLoaded,
    isAdmin,
    workspace,
    setWorkspace,
    detailTab,
    setDetailTab,
    adminSection,
    setAdminSection,
    activeDate,
    setActiveDate: handleChangeActiveDate,
    handleChangeActiveDate,
    dates,
    recipes,
    userRecipes,
    recommendedItems,
    recommendationBadges,
    plans,
    foods,
    report,
    generatedResult,
    videoUrl,
    setVideoUrl,
    videoExtraction,
    targetCalories: String(dailyTargetCalories),
    dailyTargetCalories,
    dailyGoalDraft,
    setDailyGoalDraft,
    dailyGoalModalVisible,
    openDailyGoalEditor,
    closeDailyGoalEditor,
    handleSaveDailyGoal,
    selectedCalorieGoal,
    setSelectedCalorieGoal: handleSelectCalorieGoal,
    selectedCalorieGoalOption,
    selectedMealTypes,
    selectedMealType,
    setSelectedMealType,
    scheduleDraft,
    scheduleMealType,
    scheduleTime,
    setScheduleTime,
    handleSelectScheduleMealType,
    closeScheduleModal,
    handleConfirmScheduleMeal,
    missingIngredientPrompt,
    closeMissingIngredientPrompt,
    handleAddMissingIngredientsToShoppingList,
    inventoryBuckets,
    userRecipeAvailability,
    dayTotals,
    loading,
    saving,
    adminRecipes,
    nutritionFacts,
    categories,
    storageRules,
    aiReviewItems,
    recipeForm,
    setRecipeForm,
    userRecipeForm,
    setUserRecipeForm,
    factForm,
    setFactForm,
    categoryForm,
    setCategoryForm,
    storageRuleForm,
    setStorageRuleForm,
    calculation,
    loadPlanner,
    toggleMealType,
    markRecommendationTabSeen,
    handleDismissRecommendation,
    handleGenerateDailyPlan,
    handleSaveRecommendedRecipe,
    handleExtractVideo,
    handleAddRecipeToPlan,
    handlePromptRecipeMissingIngredients,
    handleAddFoodToPlan,
    handleCycleMealStatus,
    handleRemoveMeal,
    handleDeletePlan,
    handleSaveCategory,
    handleDeleteCategory,
    handleSaveStorageRule,
    handleDeleteStorageRule,
    handleSaveNutritionFact,
    handleDeleteNutritionFact,
    handleSaveRecipe,
    handleDeleteRecipe,
    fillRecipeForm,
    handleSaveUserRecipe,
    handleDeleteUserRecipe,
    fillUserRecipeForm,
    resetRecipeForm,
    handleCalculateRecipeNutrition,
    handleReviewAiData,
  };
}
