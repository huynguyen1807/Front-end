import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import {
  AdminSection,
  BmiFormState,
  CalorieGoalKey,
  PlannerDetailTab,
  Workspace,
  calorieGoalOptions,
  createEmptyRecipeForm,
  createEmptyRecipeIngredient,
  emptyBmiForm,
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
  BmiProfile,
  FoodCategoryData,
  GeneratedMealPlanResult,
  InventoryFood,
  MealRecommendation,
  MealPlan,
  MealPlanMeal,
  MealStatus,
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
import { calculateBmiProfile } from "../utils/bmiUtils";
import { getFoodScheduleRule } from "../utils/foodScheduleRules";
import {
  addDays,
  buildUsedFoodUsage,
  getDaysUntilExpiry,
  getErrorMessage,
  getRecipeAvailability,
  getRecipeUsedFoods,
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

const getDefaultFoodPortion = (food: InventoryFood) => {
  const quantity = Number(food.quantity) || 0;
  const unit = String(food.unit || "").toLowerCase();
  if (quantity <= 0) return "1";
  if (unit === "g" || unit === "ml") return String(Math.min(quantity, 100));
  return String(Math.min(quantity, 1));
};

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
      unit: ingredient.unit || "g",
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

type AvoidRecipeReference = {
  recipeName?: string;
  ingredients?: Recipe["ingredients"];
  cookingSteps?: string[];
  tags?: string[];
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

const buildRecipeIngredientSignature = (recipe: Recipe) =>
  (recipe.ingredients || [])
    .map((ingredient) => normalizeRecipeName(ingredient.ingredientName))
    .filter(Boolean)
    .sort()
    .join("|");

const buildRecipeStepSignature = (recipe: Recipe) =>
  (recipe.cookingSteps || [])
    .map((step) => normalizeRecipeName(step.replace(/[^\p{L}\p{N}\s]/gu, "")))
    .filter(Boolean)
    .join("|");

const getRecommendationKey = (recipe: Recipe) =>
  recipe._id || `${normalizeRecipeName(recipe.recipeName)}-${recipe.sourceType || "recipe"}`;

const getRecommendationHiddenKeys = (recipe: Recipe) => {
  const keys = new Set<string>();
  if (recipe._id) keys.add(`id:${recipe._id}`);
  const normalizedName = normalizeRecipeName(recipe.recipeName);
  if (normalizedName) keys.add(`name:${normalizedName}`);
  const ingredientSignature = buildRecipeIngredientSignature(recipe);
  const stepSignature = buildRecipeStepSignature(recipe);
  if (ingredientSignature || stepSignature) {
    keys.add(`formula:${ingredientSignature}::${stepSignature}`);
  }
  keys.add(`display:${getRecommendationKey(recipe)}`);
  return Array.from(keys);
};

const buildAvoidRecipeReference = (recipe: Recipe): AvoidRecipeReference => ({
  recipeName: recipe.recipeName,
  ingredients: recipe.ingredients || [],
  cookingSteps: recipe.cookingSteps || [],
  tags: recipe.tags || [],
});

const getAvoidRecipeReferenceKey = (reference: AvoidRecipeReference) => {
  const name = normalizeRecipeName(reference.recipeName);
  const ingredients = (reference.ingredients || [])
    .map((ingredient) => normalizeRecipeName(ingredient.ingredientName))
    .filter(Boolean)
    .sort()
    .join("|");
  const steps = (reference.cookingSteps || [])
    .map((step) => normalizeRecipeName(step.replace(/[^\p{L}\p{N}\s]/gu, "")))
    .filter(Boolean)
    .join("|");
  return `${name}::${ingredients}::${steps}`;
};

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
  const [detailTab, setDetailTab] = useState<PlannerDetailTab>("video");
  const [adminSection, setAdminSection] = useState<AdminSection>("category");

  const [activeDate, setActiveDate] = useState(toDateInput(new Date()));
  const activeDateRef = useRef(activeDate);
  const hiddenRecommendationKeysRef = useRef(new Set<string>());
  const hiddenRecommendationStorageKeyRef = useRef("plannerHiddenRecommendations:current");
  const dismissedRecommendationRefsRef = useRef<AvoidRecipeReference[]>([]);
  const dismissedRecommendationRefsStorageKeyRef = useRef(
    "plannerDismissedRecommendationRefs:current"
  );
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
  const [bmiForm, setBmiForm] = useState<BmiFormState>(emptyBmiForm);
  const [bmiProfile, setBmiProfile] = useState<BmiProfile | null>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([
    "BREAKFAST",
    "LUNCH",
    "DINNER",
  ]);
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(null);
  const [scheduleMealType, setScheduleMealType] = useState<MealType>("BREAKFAST");
  const [scheduleTime, setScheduleTime] = useState(mealTypeOptions[0].time);
  const [scheduleFoodQuantity, setScheduleFoodQuantity] = useState("1");
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

  const isRecommendationHidden = useCallback((recipe: Recipe) => {
    const hiddenKeys = hiddenRecommendationKeysRef.current;
    return getRecommendationHiddenKeys(recipe).some((key) => hiddenKeys.has(key));
  }, []);

  const persistHiddenRecommendations = useCallback(async () => {
    const refs = dismissedRecommendationRefsRef.current.slice(-200);
    await Promise.all([
      AsyncStorage.setItem(
        hiddenRecommendationStorageKeyRef.current,
        JSON.stringify(Array.from(hiddenRecommendationKeysRef.current).slice(-500))
      ),
      AsyncStorage.setItem(
        dismissedRecommendationRefsStorageKeyRef.current,
        JSON.stringify(refs)
      ),
    ]);
  }, []);

  const rememberDismissedRecommendation = useCallback((recipe: Recipe) => {
    const nextReference = buildAvoidRecipeReference(recipe);
    const nextKey = getAvoidRecipeReferenceKey(nextReference);
    const existing = dismissedRecommendationRefsRef.current.filter(
      (reference) => getAvoidRecipeReferenceKey(reference) !== nextKey
    );
    dismissedRecommendationRefsRef.current = [nextReference, ...existing].slice(0, 200);
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
        const baseRecommendations = activeRecipes
          .filter((recipe) => recipe.sourceType === "SYSTEM")
          .map((recipe) => buildRecipeRecommendation(recipe, foodList));

        return mergeRecommendations(refreshedCurrent, baseRecommendations)
          .filter((item) => !isRecommendationHidden(item.recipe));
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
  }, [isAdmin, isRecommendationHidden, loadAdminData, roleLoaded]);

  const loadScheduleForDate = useCallback(async (date: string) => {
    try {
      const [planList, macroReport, foodList] = await Promise.all([
        getMealPlansApi({ date }),
        getNutritionReportApi({ periodType: "WEEK", startDate: date }),
        getAvailableFoodsApi(),
      ]);
      setPlans(planList);
      setReport(macroReport);
      setFoods(foodList);
    } catch (error: any) {
      Alert.alert("Không tải được lịch bữa ăn", getErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    activeDateRef.current = activeDate;
  }, [activeDate]);

  useEffect(() => {
    const loadRole = async () => {
      const raw = await AsyncStorage.getItem("userInfo");
      if (raw) {
        const userInfo = JSON.parse(raw);
        setIsAdmin(userInfo?.role === "ADMIN");
        const userKey = userInfo?._id || userInfo?.id || userInfo?.email || "current";
        hiddenRecommendationStorageKeyRef.current = `plannerHiddenRecommendations:${userKey}`;
        dismissedRecommendationRefsStorageKeyRef.current =
          `plannerDismissedRecommendationRefs:${userKey}`;
        const storedHiddenRecommendations = await AsyncStorage.getItem(
          hiddenRecommendationStorageKeyRef.current
        );
        if (storedHiddenRecommendations) {
          const parsedHiddenRecommendations = JSON.parse(storedHiddenRecommendations);
          hiddenRecommendationKeysRef.current = new Set(
            Array.isArray(parsedHiddenRecommendations) ? parsedHiddenRecommendations : []
          );
        }
        const storedDismissedRecommendationRefs = await AsyncStorage.getItem(
          dismissedRecommendationRefsStorageKeyRef.current
        );
        if (storedDismissedRecommendationRefs) {
          const parsedDismissedRecommendationRefs = JSON.parse(storedDismissedRecommendationRefs);
          dismissedRecommendationRefsRef.current = Array.isArray(parsedDismissedRecommendationRefs)
            ? parsedDismissedRecommendationRefs
            : [];
        }
        const storedBmiForm = await AsyncStorage.getItem(`plannerBmiForm:${userKey}`);
        if (storedBmiForm) {
          const parsedBmiForm = { ...emptyBmiForm, ...JSON.parse(storedBmiForm) };
          setBmiForm(parsedBmiForm);
          setBmiProfile(calculateBmiProfile(parsedBmiForm));
        }
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
      void loadScheduleForDate(date);
    },
    [loadScheduleForDate]
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
      const preferences = await updateUserPreferencesApi({ calorieTarget: nextTarget });
      const rawUserInfo = await AsyncStorage.getItem("userInfo");
      if (rawUserInfo) {
        const userInfo = JSON.parse(rawUserInfo);
        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...userInfo,
            preferences: {
              ...(userInfo.preferences || {}),
              ...(preferences || {}),
              calorieTarget: nextTarget,
            },
          })
        );
      }
      setDailyTargetCalories(nextTarget);
      setSelectedCalorieGoal(getCalorieGoalKeyForTarget(nextTarget));
      setDailyGoalModalVisible(false);
    } catch (error: any) {
      Alert.alert("Không lưu được mục tiêu kcal", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const getBmiStorageKey = async () => {
    const rawUserInfo = await AsyncStorage.getItem("userInfo");
    if (!rawUserInfo) return "plannerBmiForm:current";

    const userInfo = JSON.parse(rawUserInfo);
    const userKey = userInfo?._id || userInfo?.id || userInfo?.email || "current";
    return `plannerBmiForm:${userKey}`;
  };

  const handleSaveBmiProfile = async () => {
    const nextProfile = calculateBmiProfile(bmiForm);
    if (!nextProfile) {
      Alert.alert("BMI chưa hợp lệ", "Nhập cân nặng và chiều cao hợp lệ để tính BMI.");
      return;
    }

    const storageKey = await getBmiStorageKey();
    await AsyncStorage.setItem(storageKey, JSON.stringify(bmiForm));
    setBmiProfile(nextProfile);
  };

  const handleClearBmiProfile = async () => {
    const storageKey = await getBmiStorageKey();
    await AsyncStorage.removeItem(storageKey);
    setBmiForm(emptyBmiForm);
    setBmiProfile(null);
  };

  const markRecommendationTabSeen = (tab: RecommendationTabKey) => {
    setRecommendationBadges((current) => ({ ...current, [tab]: false }));
  };

  const handleDismissRecommendation = (recipe: Recipe) => {
    getRecommendationHiddenKeys(recipe).forEach((key) => {
      hiddenRecommendationKeysRef.current.add(key);
    });
    rememberDismissedRecommendation(recipe);
    void persistHiddenRecommendations();
    setRecommendedItems((current) =>
      current.filter((item) => !isRecommendationHidden(item.recipe))
    );
  };

  const handleGenerateDailyPlan = async () => {
    try {
      setSaving(true);
      const avoidRecipeMap = new Map<string, AvoidRecipeReference>();
      [
        ...dismissedRecommendationRefsRef.current,
        ...recommendedItems.map((item) => buildAvoidRecipeReference(item.recipe)),
      ].forEach((reference) => {
        const key = getAvoidRecipeReferenceKey(reference);
        if (key.replace(/:/g, "")) {
          avoidRecipeMap.set(key, reference);
        }
      });
      const result = await generateDailyMealPlanApi({
        planDate: activeDate,
        calorieTarget: dailyTargetCalories,
        calorieMin: selectedCalorieGoalOption.min,
        calorieMax: selectedCalorieGoalOption.max,
        mealTypes: selectedMealTypes,
        bmiProfile: bmiProfile || undefined,
        avoidRecipes: Array.from(avoidRecipeMap.values()).slice(0, 80),
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
      ).filter((item) => !isRecommendationHidden(item.recipe));

      setRecommendedItems((current) => {
        return mergeRecommendations(nextRecommendations, current)
          .filter((item) => !isRecommendationHidden(item.recipe));
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
      Alert.alert("Không tạo được lịch bữa ăn", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleExtractVideo = async () => {
    if (!videoUrl.trim()) {
      Alert.alert("Thiếu link video", "Dán link video trước khi trích xuất công thức.");
      return;
    }

    try {
      setSaving(true);
      const result = await extractRecipeFromVideoApi({ videoUrl: videoUrl.trim() });
      setVideoExtraction(result);
      setVideoUrl("");
    } catch (error: any) {
      Alert.alert("Không trích xuất được công thức", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openScheduleDraft = (draft: Exclude<ScheduleDraft, null>) => {
    const defaultOption = mealTypeOptions[0];
    setScheduleDraft(draft);
    setScheduleMealType(defaultOption.key);
    setScheduleTime(defaultOption.time);
    if (draft.type === "food") {
      setScheduleFoodQuantity(getDefaultFoodPortion(draft.food));
    }
  };

  const handleSelectScheduleMealType = (mealType: MealType) => {
    const option = mealTypeOptions.find((item) => item.key === mealType) || mealTypeOptions[0];
    setScheduleMealType(option.key);
    setScheduleTime(option.time);
  };

  const closeScheduleModal = () => {
    setScheduleDraft(null);
    setScheduleFoodQuantity("1");
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
        const usedFoods = getRecipeUsedFoods(recipe, foods);
        await saveMealToPlan({
          mealType: scheduleMealType,
          recipeId: recipe._id,
          recipeName: recipe.recipeName,
          imageUrl: recipe.imageUrl,
          scheduledTime: scheduleTime,
          calories: recipe.calories || 0,
          macroSummary: recipe.macroSummary || { protein: 0, carbs: 0, fat: 0 },
          status: "PENDING",
          usedFoods,
          usedFoodItemIds: usedFoods.map((usage) => usage.foodItemId as string),
        });
      } else {
        const { food } = scheduleDraft;
        const quantityUsed = Number(scheduleFoodQuantity.replace(",", "."));
        if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) {
          Alert.alert("Số lượng không hợp lệ", "Vui lòng nhập số lượng thực phẩm muốn dùng lớn hơn 0.");
          return;
        }
        if (quantityUsed > Number(food.quantity)) {
          Alert.alert(
            "Không đủ số lượng",
            `Trong kho chỉ còn ${food.quantity} ${food.unit}. Vui lòng chọn lượng nhỏ hơn hoặc bằng số lượng hiện có.`
          );
          return;
        }
        const usedFood = buildUsedFoodUsage(food, quantityUsed, food.unit);
        if (!usedFood) {
          Alert.alert("Không tính được khẩu phần", "Vui lòng kiểm tra lại số lượng và đơn vị thực phẩm.");
          return;
        }
        await saveMealToPlan({
          mealType: scheduleMealType,
          recipeName: food.foodName,
          imageUrl: food.imageUrl,
          scheduledTime: scheduleTime,
          calories: usedFood.calories || 0,
          macroSummary: usedFood.macroSummary || { protein: 0, carbs: 0, fat: 0 },
          status: "PENDING",
          usedFoods: [usedFood],
          usedFoodItemIds: [food._id],
        });
      }

      closeScheduleModal();
      await loadScheduleForDate(activeDateRef.current);
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
      Alert.alert("Không thêm được danh sách mua", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handlePromptRecipeMissingIngredients = (recipe: Recipe) => {
    const availability = getRecipeAvailability(recipe, foods);
    const items = buildMissingShoppingItems(recipe, availability.missingIngredients);

    if (!items.length) {
      Alert.alert("Đủ nguyên liệu", "Công thức này hiện không có nguyên liệu thiếu cần thêm vào danh sách mua.");
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
  };

  const handleAddFoodToPlan = async (food: InventoryFood) => {
    const scheduleRule = getFoodScheduleRule(food);
    if (!scheduleRule.canScheduleDirectly) {
      Alert.alert("Cần tạo công thức", scheduleRule.reason);
      return;
    }

    if (Number(food.quantity) <= 0 || food.status === "EXPIRED") {
      setMissingIngredientPrompt({
        sourceName: food.foodName,
        items: [
          {
            ingredientName: food.foodName,
            categoryId: typeof food.categoryId === "string" ? food.categoryId : undefined,
            quantity: 1,
            unit: food.unit || "g",
          },
        ],
      });
      return;
    }

    openScheduleDraft({ type: "food", food });
  };

  const handleCycleMealStatus = async (plan: MealPlan, mealIndex: number) => {
    try {
      const meals = plan.meals.map((meal, index) =>
        index === mealIndex
          ? { ...normalizeMealForApi(meal), status: nextStatus[meal.status] }
          : normalizeMealForApi(meal)
      );
      await updateMealPlanApi(plan._id, { planDate: activeDate, meals });
      await loadScheduleForDate(activeDateRef.current);
    } catch (error: any) {
      Alert.alert("Không cập nhật được meal", getErrorMessage(error));
    }
  };

  const handleUpdateMealStatus = async (
    plan: MealPlan,
    mealIndex: number,
    status: MealStatus
  ) => {
    try {
      const meals = plan.meals.map((meal, index) =>
        index === mealIndex
          ? { ...normalizeMealForApi(meal), status }
          : normalizeMealForApi(meal)
      );
      await updateMealPlanApi(plan._id, { planDate: activeDate, meals });
      await loadScheduleForDate(activeDateRef.current);
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
      await loadScheduleForDate(activeDateRef.current);
    } catch (error: any) {
      Alert.alert("Không xóa được meal", getErrorMessage(error));
    }
  };

  const handleDeletePlan = (plan: MealPlan) => {
    Alert.alert("Xóa lịch bữa ăn", "Xóa toàn bộ lịch bữa ăn ngày này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMealPlanApi(plan._id);
            await loadScheduleForDate(activeDateRef.current);
          } catch (error: any) {
            Alert.alert("Không xóa được lịch bữa ăn", getErrorMessage(error));
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
      Alert.alert("Công thức đã có", "Công thức này đã nằm trong danh sách công thức cá nhân.");
      return;
    }

    try {
      setSaving(true);
      await createUserRecipeApi(buildRecipePayloadFromRecipe(recipe));
      await loadPlanner({ showLoading: false });
    } catch (error: any) {
      Alert.alert("Không thêm được công thức", getErrorMessage(error));
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
      Alert.alert("Thiếu tên công thức", "Vui lòng nhập tên công thức.");
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
      Alert.alert("Không lưu được công thức", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserRecipe = async () => {
    if (!userRecipeForm.recipeName.trim()) {
      Alert.alert("Thiếu tên công thức", "Vui lòng nhập tên công thức.");
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
      Alert.alert("Không lưu được công thức cá nhân", getErrorMessage(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUserRecipe = (recipe: Recipe) => {
    Alert.alert("Xóa công thức", `Xóa "${recipe.recipeName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUserRecipeApi(recipe._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được công thức", getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    if (!isAdmin) return;
    Alert.alert("Xóa công thức", `Xóa "${recipe.recipeName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAdminRecipeApi(recipe._id);
            await loadPlanner();
          } catch (error: any) {
            Alert.alert("Không xóa được công thức", getErrorMessage(error));
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
    bmiForm,
    setBmiForm,
    bmiProfile,
    handleSaveBmiProfile,
    handleClearBmiProfile,
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
    scheduleFoodQuantity,
    setScheduleFoodQuantity,
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
    handleUpdateMealStatus,
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
