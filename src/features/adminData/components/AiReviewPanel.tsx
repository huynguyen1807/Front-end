import { Text, View } from "react-native";

import { AiGeneratedData } from "../../planner/types/planner";
import { adminDataStyles as styles } from "../styles/AdminData.styles";
import AdminActionButton from "./shared/AdminActionButton";
import AdminSection from "./shared/AdminSection";

type AiReviewPanelProps = {
  aiReviewItems: AiGeneratedData[];
  saving: boolean;
  onReviewAiData: (item: AiGeneratedData, action: "APPROVE" | "REJECT") => void;
};

export default function AiReviewPanel({
  aiReviewItems,
  saving,
  onReviewAiData,
}: AiReviewPanelProps) {
  return (
    <AdminSection
      title="Review AI-generated Data"
      subtitle="Duyệt dữ liệu AI trước khi đưa vào recipe, nutrition hoặc storage chính thức."
    >
      {aiReviewItems.length === 0 ? (
        <Text style={styles.emptyText}>Không có AI-generated data chờ duyệt.</Text>
      ) : (
        aiReviewItems.map((item) => (
          <View key={item._id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewType}>{item.dataType}</Text>
              <Text style={styles.reviewStatus}>{item.status}</Text>
            </View>
            <Text style={styles.reviewContent} numberOfLines={5}>
              {JSON.stringify(item.generatedContent, null, 2)}
            </Text>
            <View style={styles.actionRow}>
              <AdminActionButton
                label="Approve"
                icon="check-decagram-outline"
                onPress={() => onReviewAiData(item, "APPROVE")}
                disabled={saving}
              />
              <AdminActionButton
                label="Reject"
                icon="close-octagon-outline"
                secondary
                onPress={() => onReviewAiData(item, "REJECT")}
                disabled={saving}
              />
            </View>
          </View>
        ))
      )}
    </AdminSection>
  );
}
