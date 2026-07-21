import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import { RADIUS, SPACING } from "../../../constants/spacing";
import {
  buildOpenRouteServiceUrl,
  getNearbyPlacesApi,
} from "../services/nearbyPlacesApi";
import { NearbyPlace, NearbyPlaceLocation } from "../types/nearbyPlace";

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export default function NearbyStoresSection() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userLocation, setUserLocation] = useState<NearbyPlaceLocation | null>(null);

  const loadNearbyStores = async () => {
    setLoading(true);
    setPermissionDenied(false);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userLocation: NearbyPlaceLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(userLocation);

      const nearbyPlaces = await getNearbyPlacesApi(userLocation);
      setPlaces(nearbyPlaces);
    } catch (error) {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyStores();
  }, []);

  const openMaps = (place: NearbyPlace) => {
    if (!userLocation) return;
    Linking.openURL(buildOpenRouteServiceUrl(userLocation, place.location));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Gần bạn</Text>
          <Text style={styles.subtitle}>Siêu thị, chợ, mart và cửa hàng tiện lợi</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={loadNearbyStores} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tìm địa điểm gần bạn...</Text>
        </View>
      ) : permissionDenied ? (
        <TouchableOpacity activeOpacity={0.85} onPress={loadNearbyStores} style={styles.permissionBox}>
          <Ionicons name="location-outline" size={24} color={COLORS.primary} />
          <Text style={styles.permissionText}>Cấp quyền vị trí để xem cửa hàng gần bạn</Text>
        </TouchableOpacity>
      ) : places.length === 0 ? (
        <View style={styles.permissionBox}>
          <Ionicons name="storefront-outline" size={24} color={COLORS.primary} />
          <Text style={styles.permissionText}>Chưa tìm thấy địa điểm gần bạn</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.placeRow}>
            {places.map((place) => (
              <TouchableOpacity
                key={place.id}
                activeOpacity={0.86}
                onPress={() => openMaps(place)}
                style={styles.placeCard}
              >
                <View style={styles.placeIcon}>
                  <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
                </View>
                <Text numberOfLines={1} style={styles.placeName}>
                  {place.name}
                </Text>
                {!!place.address && (
                  <Text numberOfLines={1} style={styles.placeAddress}>
                    {place.address}
                  </Text>
                )}
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{formatDistance(place.distanceMeters)}</Text>
                  {place.rating ? <Text style={styles.metaText}>⭐ {place.rating}</Text> : null}
                  {place.isOpen !== undefined && (
                    <Text style={[styles.metaText, place.isOpen ? styles.openText : styles.closedText]}>
                      {place.isOpen ? "Mở" : "Đóng"}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  loadingBox: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderColor: "rgba(189, 202, 191, 0.35)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    minHeight: 74,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "700",
  },
  permissionBox: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderColor: "rgba(189, 202, 191, 0.35)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: SPACING.md,
    minHeight: 74,
    paddingHorizontal: SPACING.lg,
  },
  permissionText: {
    color: COLORS.onSurface,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  placeRow: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  placeCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderColor: "rgba(189, 202, 191, 0.35)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 132,
    padding: SPACING.md,
    width: 190,
  },
  placeIcon: {
    alignItems: "center",
    backgroundColor: COLORS.primary + "18",
    borderRadius: RADIUS.full,
    height: 36,
    justifyContent: "center",
    marginBottom: SPACING.sm,
    width: 36,
  },
  placeName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "800",
  },
  placeAddress: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metaText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
  },
  openText: {
    color: COLORS.primary,
  },
  closedText: {
    color: COLORS.error,
  },
  demoText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
});
