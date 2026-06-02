import HomeScreen from "../features/home/screens/HomeScreen";
import { SettingsScreen } from "../features/settings";
import { ScannerScreen } from "../features/scan";
import { useNavigation } from "./providers/NavigationProvider";
import PlaceholderScreen from "./screens/PlaceholderScreen";

export default function AppNavigator() {
  const { activeTab } = useNavigation();

  switch (activeTab) {
    case "scan":
      return <ScannerScreen />;
    case "meal":
      return <PlaceholderScreen tabName="Meal Planner" />;
    case "shopping":
      return <PlaceholderScreen tabName="Shopping List" />;
    case "settings":
      return <SettingsScreen />;
    case "home":
    default:
      return <HomeScreen />;
  }
}
