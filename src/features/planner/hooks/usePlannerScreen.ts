import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import {
  AdminSection,
  PlannerDetailTab,
  Workspace,
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
  generateDailyMealPlanApi,
  getAvailableFoodsApi,
  getMealPlansApi,
  getRecipesApi,
  updateMealPlanApi,
} from "../services/plannerApi";
import {
  AiGeneratedData,
  FoodCategoryData,
  GeneratedMealPlanResult,
  InventoryFood,
  MealPlan,
  MealPlanMeal,
  MealType,
  NutritionCalculation,
  NutritionFact,
  NutritionReport,
  Recipe,
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

export default function usePlannerScreen() {
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>("meal");
  const [detailTab, setDetailTab] = useState<PlannerDetailTab>("inventory");
  const [adminSection, setAdminSection] = useState<AdminSection>("category");

  const [activeDate, setActiveDate] = useState(toDateInput(new Date()));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [foods, setFoods] = useState<InventoryFood[]>([]);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedMealPlanResult | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoExtraction, setVideoExtraction] = useState<VideoRecipeExtraction | null>(null);
  const [targetCalories, setTargetCalories] = useState("2000");
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([
    "BREAKFAST",
    "LUNCH",
    "DINNER",
  ]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");

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
    const available = foods.filter((food) => food.status !== "EXPIRED");
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

  const loadPlanner = useCallback(async () => {
    if (!roleLoaded) return;

    try {
      setLoading(true);
      const [recipeList, userRecipeList, planList, macroReport, foodList] = await Promise.all([
        getRecipesApi(),
        getUserRecipesApi(),
        getMealPlansApi({ date: activeDate }),
        getNutritionReportApi({ periodType: "WEEK", startDate: activeDate }),
        getAvailableFoodsApi(),
      ]);

      setRecipes(recipeList.filter(
        (recipe) => recipe.isActive !== false && recipe.sourceType !== "USER_CREATED"
      ));
      setUserRecipes(userRecipeList.filter((recipe) => recipe.isActive !== false));
      setPlans(planList);
      setReport(macroReport);
      setFoods(foodList);

      if (isAdmin) {
        await loadAdminData();
      }
    } catch (error: any) {
      Alert.alert("Không tải được Meal Planner", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [activeDate, isAdmin, loadAdminData, roleLoaded]);

  useEffect(() => {
    const loadRole = async () => {
      const raw = await AsyncStorage.getItem("userInfo");
      if (raw) {
        const userInfo = JSON.parse(raw);
        setIsAdmin(userInfo?.role === "ADMIN");
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

  const toggleMealType = (mealType: MealType) => {
    setSelectedMealTypes((current) => {
      if (current.includes(mealType)) {
        return current.length === 1 ? current : current.filter((item) => item !== mealType);
      }
      return [...current, mealType];
    });
  };

  const handleGenerateDailyPlan = async () => {
    try {
      setSaving(true);
      const result = await generateDailyMealPlanApi({
        planDate: activeDate,
        calorieTarget: Number(targetCalories) || undefined,
        mealTypes: selectedMealTypes,
      });
      setGeneratedResult(result);
      const generatedRecipes = [
        ...(result.generatedRecipes || []),
        ...result.recommendations.map((item) => item.recipe),
      ];
      setRecipes((current) => {
        const map = new Map<string, Recipe>();
        [...generatedRecipes, ...current].forEach((recipe) => {
          if (recipe?._id && recipe.isActive !== false && recipe.sourceType !== "USER_CREATED") {
            map.set(recipe._id, recipe);
          }
        });
        return Array.from(map.values());
      });
      setDetailTab("inventory");
      await loadPlanner();
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

  const handleAddRecipeToPlan = async (recipe: Recipe) => {
    const availability = getRecipeAvailability(recipe, foods);
    if (!availability.canSchedule) {
      Alert.alert(
        "Thiếu nguyên liệu",
        `Recipe này còn thiếu: ${availability.missingIngredients.join(", ")}`
      );
      return;
    }

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
      await loadPlanner();
    } catch (error: any) {
      Alert.alert("Không thêm được meal", getErrorMessage(error));
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
      await loadPlanner();
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
      await loadPlanner();
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
            await loadPlanner();
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
      return;
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
    } catch (error: any) {
      Alert.alert("Không lưu được recipe cá nhân", getErrorMessage(error));
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
    setActiveDate,
    dates,
    recipes,
    userRecipes,
    plans,
    foods,
    report,
    generatedResult,
    videoUrl,
    setVideoUrl,
    videoExtraction,
    targetCalories,
    setTargetCalories,
    selectedMealTypes,
    selectedMealType,
    setSelectedMealType,
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
    handleGenerateDailyPlan,
    handleExtractVideo,
    handleAddRecipeToPlan,
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
