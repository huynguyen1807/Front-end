import { ScanResult } from '../types/scan';
import { scanProductComplete } from '../../../services/aiService';
import { InventoryOwnerContext } from '../../inventory/types/inventory';

/**
 * Scan product using AI service
 * Falls back to mock data if API fails (for development)
 * 
 * Set __DEV__ to true to use mock data by default
 * Set __DEV__ to false to use real AI API
 */
const USE_MOCK_DATA = false; // Set to false when backend API is ready
let lastMockIndex = -1; // Track last index to avoid repeats

export const scanProductFromImage = async (
  imageUri: string,
  inventoryContext?: InventoryOwnerContext,
): Promise<ScanResult> => {
  try {
    // Use mock data in development mode
    if (USE_MOCK_DATA) {
      // Simulate API delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1200));
      return getMockScanResult(imageUri);
    }

    // Call real AI service when backend is ready
    return await scanProductComplete(imageUri, undefined, inventoryContext);
  } catch (error) {
    console.warn('[Scan] AI scan failed', error);
    throw error instanceof Error
      ? error
      : new Error('KhÃ´ng thá»ƒ nháº­n diá»‡n thá»±c pháº©m tá»« áº£nh nÃ y');
  }
};

/**
 * Mock scan result for development/testing
 */
const getMockScanResult = (imageUri: string): ScanResult => {
  const mockProducts: ScanResult[] = [
    {
      id: '1',
      foodRecognition: {
        productName: 'Chuối Cavendish',
        category: 'Trái cây',
        confidence: 0.95,
      },
      aiPredictedDays: 5,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      storageSuggestion: {
        location: 'outside',
        description: 'Bảo quản ở nhiệt độ phòng, tránh ánh nắng trực tiếp',
        temperature: '20-25°C',
      },
      mealSuggestions: [
        {
          dishName: 'Chuối nướng mật ong',
          ingredients: ['Chuối', 'Mật ong', 'Bơ'],
          cookingTime: 15,
          difficulty: 'easy',
        },
        {
          dishName: 'Smoothie chuối dâu',
          ingredients: ['Chuối', 'Dâu', 'Sữa', 'Mật ong'],
          cookingTime: 5,
          difficulty: 'easy',
        },
      ],
      nutritionInfo: {
        calories: 89,
        protein: 1.1,
        carbs: 23,
        fat: 0.3,
      },
      imageUrl: imageUri,
    },
    {
      id: '2',
      foodRecognition: {
        productName: 'Ớt chuông đỏ',
        category: 'Rau quả',
        confidence: 0.92,
      },
      aiPredictedDays: 7,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      storageSuggestion: {
        location: 'fridge',
        description: 'Bảo quản trong tủ lạnh, giữ độ ẩm 90-95%',
        temperature: '7-10°C',
      },
      mealSuggestions: [
        {
          dishName: 'Ớt nhồi cơm',
          ingredients: ['Ớt', 'Cơm', 'Thịt bò', 'Hành tây'],
          cookingTime: 30,
          difficulty: 'medium',
        },
        {
          dishName: 'Ớt nướng kiểu Ý',
          ingredients: ['Ớt', 'Dầu olive', 'Tỏi', 'Chanh'],
          cookingTime: 25,
          difficulty: 'easy',
        },
      ],
      nutritionInfo: {
        calories: 31,
        protein: 1,
        carbs: 6,
        fat: 0.3,
      },
      imageUrl: imageUri,
    },
    {
      id: '3',
      foodRecognition: {
        productName: 'Cà chua tươi',
        category: 'Rau quả',
        confidence: 0.98,
      },
      aiPredictedDays: 4,
      expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      storageSuggestion: {
        location: 'outside',
        description: 'Bảo quản ngoài tủ lạnh, tránh nơi ẩm ướt',
        temperature: '18-22°C',
      },
      mealSuggestions: [
        {
          dishName: 'Salad cà chua',
          ingredients: ['Cà chua', 'Dưa chuột', 'Hành tây', 'Dầu olive'],
          cookingTime: 10,
          difficulty: 'easy',
        },
        {
          dishName: 'Nước sốt cà chua',
          ingredients: ['Cà chua', 'Tỏi', 'Ớt', 'Chanh'],
          cookingTime: 20,
          difficulty: 'easy',
        },
      ],
      nutritionInfo: {
        calories: 18,
        protein: 0.9,
        carbs: 3.9,
        fat: 0.2,
      },
      imageUrl: imageUri,
    },
    {
      id: '4',
      foodRecognition: {
        productName: 'Salad xanh',
        category: 'Rau quả',
        confidence: 0.89,
      },
      aiPredictedDays: 3,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      storageSuggestion: {
        location: 'fridge',
        description: 'Bảo quản ở tủ lạnh với độ ẩm cao',
        temperature: '4-7°C',
      },
      mealSuggestions: [
        {
          dishName: 'Salad Caesar',
          ingredients: ['Salad', 'Phô mai', 'Tỏi', 'Dầu olive'],
          cookingTime: 15,
          difficulty: 'easy',
        },
        {
          dishName: 'Salad trộn',
          ingredients: ['Salad', 'Cà chua', 'Dưa chuột', 'Nước mè'],
          cookingTime: 10,
          difficulty: 'easy',
        },
      ],
      nutritionInfo: {
        calories: 15,
        protein: 1.2,
        carbs: 2.9,
        fat: 0.1,
      },
      imageUrl: imageUri,
    },
    {
      id: '5',
      foodRecognition: {
        productName: 'Trứng gà',
        category: 'Protein',
        confidence: 0.96,
      },
      aiPredictedDays: 21,
      expiryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      storageSuggestion: {
        location: 'fridge',
        description: 'Bảo quản trong tủ lạnh, để trong khay trứng',
        temperature: '2-5°C',
      },
      mealSuggestions: [
        {
          dishName: 'Trứng chiên',
          ingredients: ['Trứng', 'Dầu ăn', 'Muối', 'Tiêu'],
          cookingTime: 5,
          difficulty: 'easy',
        },
        {
          dishName: 'Trứng ốp la',
          ingredients: ['Trứng', 'Bơ', 'Dù hành', 'Muối'],
          cookingTime: 8,
          difficulty: 'easy',
        },
      ],
      nutritionInfo: {
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
      },
      imageUrl: imageUri,
    },
  ];

  // Get next index (cycle through products)
  lastMockIndex = (lastMockIndex + 1) % mockProducts.length;
  return mockProducts[lastMockIndex];
};

/**
 * Validate image before scanning
 */
export const validateImage = (
  imageUri: string
): { valid: boolean; error?: string } => {
  if (!imageUri) {
    return { valid: false, error: 'Không có ảnh' };
  }

  // Check file size (max 5MB)
  // In real implementation, you'd check the actual file size

  return { valid: true };
};
