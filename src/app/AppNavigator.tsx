import HomeScreen from "../features/home/screens/HomeScreen";
import { SettingsScreen } from "../features/settings";
import AddShoppingItemScreen from "../features/shoppingList/screens/AddShoppingItemScreen";
import { useNavigation } from "./providers/NavigationProvider";

export default function AppNavigator() {
  const { activeTab } = useNavigation();

  switch (activeTab) {
    case "settings":
      return <SettingsScreen />;
    case "shopping":
      return <AddShoppingItemScreen />;
    default:
      return <HomeScreen />;
  }
}
