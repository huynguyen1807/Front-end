import { apiClient } from './apiClient';
import { ScanResult, FoodRecognition, StorageSuggestion, MealSuggestion, NutritionInfo } from '../features/scan/types/scan';

/**
 * AI Service - Handles all AI-related API calls using apiClient (Axios with Auth headers)
 */

/**
 * Recognize food from image
 */
export const recognizeFood = async (imageUri: string): Promise<FoodRecognition> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'food-image.jpg',
  } as any);

  const response = await apiClient.post('/api/ai/recognize-food', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
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
  storageLocation?: string
): Promise<ScanResult> => {
  try {
    // Step 1: Recognize food from image
    const foodRecognition = await recognizeFood(imageUri);

    // Step 2: Predict expiry date
    const expiryPrediction = await predictExpiryDate(
      foodRecognition.productName,
      storageLocation || 'outside'
    );

    // Step 3: Get storage suggestions
    const storageSuggestions = await getStorageSuggestions(
      foodRecognition.productName
    );

    // Step 4: Get meal suggestions
    const mealSuggestions = await getMealSuggestions(
      foodRecognition.productName
    );

    // Step 5: Get nutrition info
    let nutritionInfo;
    try {
      nutritionInfo = await getNutritionInfo(foodRecognition.productName);
    } catch (error) {
      // Nutrition is optional, continue without it
    }

    // Pick the best storage suggestion or default
    const bestStorage = storageSuggestions[0] || {
      location: 'outside' as const,
      description: 'Bảo quan ở nhiệt độ phòng',
      temperature: '15-25°C',
    };

    return {
      id: `${Date.now()}`,
      foodRecognition,
      aiPredictedDays: expiryPrediction.predictedDays,
      expiryDate: expiryPrediction.expiryDate,
      storageSuggestion: bestStorage,
      mealSuggestions: mealSuggestions.slice(0, 3), // Top 3 suggestions
      nutritionInfo,
      imageUrl: imageUri,
    };
  } catch (error) {
    throw error;
  }
};
