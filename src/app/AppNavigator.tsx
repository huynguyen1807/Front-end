import HomeScreen from "../features/home/screens/HomeScreen";
import PlannerScreen from "../features/planner/screens/PlannerScreen";
import { SettingsScreen } from "../features/settings";
import { useNavigation } from "./providers/NavigationProvider";

export default function AppNavigator() {
  const { activeTab } = useNavigation();

  switch (activeTab) {
    case "meal":
      return <PlannerScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}
