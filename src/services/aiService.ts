import { apiClient } from './apiClient';
import { ScanResult, FoodRecognition, StorageSuggestion, MealSuggestion, NutritionInfo } from '../features/scan/types/scan';
import { InventoryOwnerContext } from '../features/inventory/types/inventory';

/**
 * AI Service - Handles all AI-related API calls using apiClient (Axios with Auth headers)
 */

const getApiErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  return (
    data?.message ||
    data?.warnings?.[0] ||
    data?.error ||
    error?.message ||
    fallback
  );
};

/**
 * Recognize food from image
 */
export const recognizeFood = async (
  imageUri: string,
  inventoryContext?: InventoryOwnerContext,
): Promise<FoodRecognition> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'food-image.jpg',
  } as any);

  try {
    const response = await apiClient.post('/api/ai/recognize-food', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: inventoryContext,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(getApiErrorMessage(error, 'Khong the nhan dien thuc pham tu anh nay.'));
  }
};

/**
 * Predict expiry date for food
 */
export const predictExpiryDate = async (
  productName: string,
  storageLocation: string
): Promise<{ predictedDays: number; expiryDate: string; explanation: string }> => {
  const response = await apiClient.post('/api/ai/predict-expiry', {
    productName,
    storageLocation,
  });

  return response.data;
};

/**
 * Get storage suggestions
 */
export const getStorageSuggestions = async (
  productName: string
): Promise<StorageSuggestion[]> => {
  const response = await apiClient.post('/api/ai/storage-suggestions', {
    productName,
  });

  return response.data;
};

/**
 * Get meal suggestions based on inventory
 */
export const getMealSuggestions = async (
  productName: string,
  userPreferences?: {
    cuisineType?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    cookingTime?: number;
  }
): Promise<MealSuggestion[]> => {
  const response = await apiClient.post('/api/ai/meal-suggestions', {
    productName,
    preferences: userPreferences,
  });

  return response.data;
};

/**
 * Get nutrition information
 */
export const getNutritionInfo = async (
  productName: string,
  quantity?: number
): Promise<NutritionInfo> => {
  const response = await apiClient.post('/api/ai/nutrition-info', {
    productName,
    quantity: quantity || 100,
  });

  return response.data;
};

const addDaysAsDisplayDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

const defaultStorageSuggestion: StorageSuggestion = {
  location: 'outside',
  storageType: 'OUTSIDE',
  description: 'Bao quan noi kho, thoang mat va kiem tra lai truoc khi them vao kho.',
  temperature: '20-25C',
  estimatedDays: 3,
};

const isRecognizedFood = (foodRecognition: FoodRecognition) =>
  foodRecognition.isFood !== false && foodRecognition.confidence >= 0.2;

/**
 * Analyze cooking video (extract recipe details)
 */
export const analyzeRecipeVideo = async (videoUri: string): Promise<{
  dishName: string;
  ingredients: string[];
  cookingSteps: string[];
  cookingTime: number;
}> => {
  const formData = new FormData();
  formData.append('video', {
    uri: videoUri,
    type: 'video/mp4',
    name: 'recipe-video.mp4',
  } as any);

  const response = await apiClient.post('/api/ai/analyze-recipe-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get personalized menu recommendations
 */
export const getPersonalizedMenu = async (
  inventory: string[],
  userProfile?: {
    preferences?: string[];
    restrictions?: string[];
    targetCalories?: number;
    mealType?: 'breakfast' | 'lunch' | 'dinner';
  }
): Promise<MealSuggestion[]> => {
  const response = await apiClient.post('/api/ai/personalized-menu', {
    inventory,
    userProfile,
  });

  return response.data;
};

/**
 * Complete scan - combines all AI features
 */
export const scanProductComplete = async (
  imageUri: string,
  storageLocation?: string,
  inventoryContext?: InventoryOwnerContext,
): Promise<ScanResult> => {
  const foodRecognition = await recognizeFood(imageUri, inventoryContext);
  if (foodRecognition.errorCode) {
    throw new Error(
      foodRecognition.warnings?.[0] ||
      'Gemini khong kha dung de nhan dien anh nay.'
    );
  }

  const recognizedFood = isRecognizedFood(foodRecognition);

  let bestStorage = foodRecognition.storageSuggestion || defaultStorageSuggestion;
  if (!foodRecognition.storageSuggestion && recognizedFood) {
    try {
      const storageSuggestions = await getStorageSuggestions(foodRecognition.productName);
      bestStorage = storageSuggestions[0] || bestStorage;
    } catch (error) {
      console.warn('[Scan] storage suggestion fallback', error);
    }
  }

  let expiryPrediction = foodRecognition.expiryEstimate || {
    predictedDays: bestStorage.estimatedDays || 3,
    expiryDate: addDaysAsDisplayDate(bestStorage.estimatedDays || 3),
    explanation: bestStorage.description,
  };
  if (!foodRecognition.expiryEstimate && recognizedFood) {
    try {
      expiryPrediction = await predictExpiryDate(
        foodRecognition.productName,
        storageLocation || bestStorage.location || 'outside'
      );
    } catch (error) {
      console.warn('[Scan] expiry prediction fallback', error);
    }
  }

  let mealSuggestions: MealSuggestion[] = [];
  if (recognizedFood) {
    try {
      const meals = await getMealSuggestions(foodRecognition.productName);
      mealSuggestions = Array.isArray(meals) ? meals.slice(0, 3) : [];
    } catch (error) {
      console.warn('[Scan] meal suggestions unavailable', error);
    }
  }

  let nutritionInfo = foodRecognition.nutritionEstimate;
  if (!nutritionInfo && recognizedFood) {
    try {
      nutritionInfo = await getNutritionInfo(foodRecognition.productName);
    } catch (error) {
      console.warn('[Scan] nutrition unavailable', error);
    }
  }

  return {
    id: `${Date.now()}`,
    foodRecognition,
    aiPredictedDays: expiryPrediction.predictedDays,
    expiryDate: expiryPrediction.expiryDate,
    storageSuggestion: bestStorage,
    mealSuggestions,
    nutritionInfo,
    imageUrl: imageUri,
  };
};
