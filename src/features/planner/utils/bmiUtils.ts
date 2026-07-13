import { BmiFormState } from "../constants/plannerConstants";
import { BmiProfile } from "../types/planner";

export function calculateBmiProfile(form: BmiFormState): BmiProfile | null {
  const weightKg = Number(form.weightKg);
  const heightCm = Number(form.heightCm);
  const age = Number(form.age);

  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const roundedBmi = Math.round(bmi * 10) / 10;
  const category =
    roundedBmi < 18.5
      ? "UNDERWEIGHT"
      : roundedBmi < 25
        ? "NORMAL"
        : roundedBmi < 30
          ? "OVERWEIGHT"
          : "OBESE";
  const categoryLabel = {
    UNDERWEIGHT: "Thiếu cân",
    NORMAL: "Bình thường",
    OVERWEIGHT: "Thừa cân",
    OBESE: "Béo phì",
  }[category];

  return {
    weightKg,
    heightCm,
    age: Number.isFinite(age) && age > 0 ? age : undefined,
    gender: form.gender,
    activityLevel: form.activityLevel,
    goal: form.goal,
    bmi: roundedBmi,
    category,
    categoryLabel,
  };
}

export function getBmiSuggestion(profile: BmiProfile | null) {
  if (!profile) {
    return "Chưa có BMI, AI sẽ dùng chuẩn dinh dưỡng phổ thông cho người khỏe mạnh.";
  }

  if (profile.category === "UNDERWEIGHT") {
    return "Ưu tiên bữa ăn đủ năng lượng, protein và carb tốt để hỗ trợ tăng cân lành mạnh.";
  }

  if (profile.category === "OVERWEIGHT" || profile.category === "OBESE") {
    return "Ưu tiên món giàu protein, nhiều rau, kiểm soát chất béo và calories.";
  }

  return "Ưu tiên cân bằng protein, carb, fat và đa dạng nhóm thực phẩm.";
}
