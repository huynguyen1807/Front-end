import { View, Text } from "react-native";
import { COLORS } from "../../constants/colors";
import ScreenContainer from "../../components/layout/ScreenContainer";
import TopNavbar from "../../components/layout/TopNavbar";
import BottomNavbar from "../../components/layout/BottomNavbar";

type PlaceholderScreenProps = {
  tabName: string;
};

export default function PlaceholderScreen({ tabName }: PlaceholderScreenProps) {
  return (
    <ScreenContainer>
      <TopNavbar />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 100,
        }}
      >
        <Text style={{ fontSize: 18, color: COLORS.onSurfaceVariant }}>
          {tabName} - Coming Soon
        </Text>
      </View>
      <BottomNavbar />
    </ScreenContainer>
  );
}
