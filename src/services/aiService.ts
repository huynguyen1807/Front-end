import { appConfig } from '../config/env';
import { ScanResult, FoodRecognition, StorageSuggestion, MealSuggestion, NutritionInfo } from '../features/scan/types/scan';

/**
 * AI Service - Handles all AI-related API calls
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

  const response = await fetch(`${appConfig.apiUrl}/api/ai/recognize-food`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to recognize food');
  }

  return response.json();
};

/**
 * Predict expiry date for food
 */
export const predictExpiryDate = async (
  productName: string,
  storageLocation: string
): Promise<{ predictedDays: number; expiryDate: string }> => {
  const response = await fetch(`${appConfig.apiUrl}/api/ai/predict-expiry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productName,
      storageLocation,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to predict expiry date');
  }

  return response.json();
};

/**
 * Get storage suggestions
 */
export const getStorageSuggestions = async (
  productName: string
): Promise<StorageSuggestion[]> => {
  const response = await fetch(`${appConfig.apiUrl}/api/ai/storage-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productName }),
  });

  if (!response.ok) {
    throw new Error('Failed to get storage suggestions');
  }

  return response.json();
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
  const response = await fetch(`${appConfig.apiUrl}/api/ai/meal-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productName,
      preferences: userPreferences,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get meal suggestions');
  }

  return response.json();
};

/**
 * Get nutrition information
 */
export const getNutritionInfo = async (
  productName: string,
  quantity?: number
): Promise<NutritionInfo> => {
  const response = await fetch(`${appConfig.apiUrl}/api/ai/nutrition-info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productName,
      quantity: quantity || 100,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get nutrition info');
  }

  return response.json();
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

  const response = await fetch(`${appConfig.apiUrl}/api/ai/analyze-recipe-video`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze recipe video');
  }

  return response.json();
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
  const response = await fetch(`${appConfig.apiUrl}/api/ai/personalized-menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inventory,
      userProfile,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get personalized menu');
  }

  return response.json();
};

/**
 * Complete scan - combines all AI features
 * Returns mock data if API fails (fallback)
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
      description: 'Bảo quản ở nhiệt độ phòng',
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
    // Silently fail - let caller handle fallback
    throw error;
  }
};
