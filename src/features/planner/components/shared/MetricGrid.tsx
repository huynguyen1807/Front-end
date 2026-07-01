import { Text, View } from "react-native";

import { plannerStyles as styles } from "../../styles/PlannerScreen.styles";

type MetricGridProps = {
  metrics: Array<{ label: string; value: string }>;
};

export default function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <View style={styles.metricGrid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={styles.metric}>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricLabel}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );
}
