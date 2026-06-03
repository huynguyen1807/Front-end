import HomeScreen from "../features/home/screens/HomeScreen";
import PlannerScreen from "../features/planner/screens/PlannerScreen";
import { SettingsScreen } from "../features/settings";
import { ScannerScreen } from "../features/scan";
import { AddShoppingItemScreen } from "../features/shoppingList";
import { useNavigation } from "./providers/NavigationProvider";
import PlaceholderScreen from "./screens/PlaceholderScreen";

export default function AppNavigator() {
  const { activeTab } = useNavigation();

  switch (activeTab) {
    case "scan":
      return <ScannerScreen />;
    case "shopping":
      return <AddShoppingItemScreen />;
    case "meal":
      return <PlannerScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}
