import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { mealTypeOptions } from "../constants/plannerConstants";
import { mealSchedulePickerStyles as styles } from "../styles/MealSchedulePicker.styles";
import { MealType, ScheduleNotice } from "../types/planner";
import {
  formatScheduleTime,
  getScheduleDateGroups,
  parseScheduleDateTime,
} from "../utils/scheduleDateTime";
import ScheduleValidationNotice from "./ScheduleValidationNotice";

type MealSchedulePickerProps = {
  date: string;
  time: string;
  mealType: MealType;
  notice: ScheduleNotice | null;
  rolloverPromptVisible: boolean;
  onChangeDate: (date: string) => void;
  onChangeTime: (time: string) => void;
  onSelectMealType: (mealType: MealType) => void;
  onDismissNotice: () => void;
};

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MealSchedulePicker({
  date,
  time,
  mealType,
  notice,
  rolloverPromptVisible,
  onChangeDate,
  onChangeTime,
  onSelectMealType,
  onDismissNotice,
}: MealSchedulePickerProps) {
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const dateGroups = getScheduleDateGroups();

  useEffect(() => {
    if (rolloverPromptVisible) setTimePickerVisible(false);
  }, [rolloverPromptVisible]);

  const handleNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setTimePickerVisible(false);
    if (event.type === "dismissed" || !selected) return;
    onChangeTime(formatScheduleTime(selected));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>Ngày lên lịch</Text>
      <View style={styles.selectedDateSummary}>
        <Ionicons name="calendar-outline" size={21} color={COLORS.primary} />
        <View style={styles.selectedDateCopy}>
          <Text style={styles.selectedDateCaption}>Đang chọn</Text>
          <Text style={styles.selectedDateText}>{formatDateLabel(date)}</Text>
        </View>
      </View>

      <View style={styles.dateGroups}>
        {dateGroups.map((group) => (
          <View key={group.key} style={styles.dateGroup}>
            <Text style={styles.weekLabel}>{group.label}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRow}
            >
              {group.dates.map((item) => {
                const active = item.value === date;
                return (
                  <TouchableOpacity
                    key={item.value}
                    accessibilityLabel={`${item.weekday}, ${item.dayMonth}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: item.disabled, selected: active }}
                    activeOpacity={0.76}
                    disabled={item.disabled}
                    onPress={() => onChangeDate(item.value)}
                    style={[
                      styles.dateButton,
                      active && styles.dateButtonActive,
                      item.disabled && styles.dateButtonDisabled,
                    ]}
                  >
                    <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                      {item.weekday}
                    </Text>
                    <Text style={[styles.dateValue, active && styles.dateTextActive]}>
                      {item.dayMonth}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Giờ và khung bữa ăn</Text>
      {Platform.OS === "web" ? (
        <TextInput
          accessibilityLabel="Giờ lên lịch"
          style={styles.webTimeInput}
          value={time}
          onChangeText={onChangeTime}
          placeholder="HH:mm"
          placeholderTextColor={COLORS.onSurfaceVariant}
        />
      ) : (
        <TouchableOpacity
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel={`Chọn giờ lên lịch, hiện tại ${time}`}
          style={styles.timeButton}
          onPress={() => setTimePickerVisible(true)}
        >
          <Ionicons name="time-outline" size={21} color={COLORS.primary} />
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.timeAction}>Điều chỉnh</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.slotScroll}
        contentContainerStyle={styles.slotContent}
      >
        {mealTypeOptions.map((option) => {
          const active = option.key === mealType;
          return (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel={`${option.label}, ${option.rangeLabel}`}
              accessibilityState={{ selected: active }}
              style={[styles.slotButton, active && styles.slotButtonActive]}
              onPress={() => onSelectMealType(option.key)}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive]}>{option.label}</Text>
              <Text style={[styles.slotRangeText, active && styles.slotTextActive]}>
                {option.rangeLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {notice ? (
        <ScheduleValidationNotice notice={notice} onDismiss={onDismissNotice} />
      ) : null}

      {timePickerVisible && Platform.OS !== "web" ? (
        <View style={Platform.OS === "ios" ? styles.iosPickerPanel : undefined}>
          <DateTimePicker
            value={parseScheduleDateTime(date, time)}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            minuteInterval={5}
            is24Hour
            timeZoneName="Asia/Ho_Chi_Minh"
            textColor={COLORS.onSurface}
            accentColor={COLORS.primary}
            themeVariant="light"
            style={styles.nativeTimePicker}
            onChange={handleNativeChange}
          />
          {Platform.OS === "ios" ? (
            <TouchableOpacity style={styles.iosPickerDone} onPress={() => setTimePickerVisible(false)}>
              <Text style={styles.iosPickerDoneText}>Xong</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
