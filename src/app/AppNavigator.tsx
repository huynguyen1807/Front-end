import HomeScreen from "../features/home/screens/HomeScreen";
import { SettingsScreen } from "../features/settings";
import { useNavigation } from "./providers/NavigationProvider";

export default function AppNavigator() {
  const { activeTab } = useNavigation();

  switch (activeTab) {
    case "settings":
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}
