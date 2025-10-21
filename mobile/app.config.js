export default {
  expo: {
    name: "Atacte",
    slug: "atacte-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#f9fafb"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      bundleIdentifier: "com.atacte.mobile",
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        NSLocationWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        NSLocationAlwaysUsageDescription: "Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Este app precisa da sua localização para compartilhar com sua família.",
        UIBackgroundModes: ["location", "remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "com.atacte.mobile",
      permissions: [
        "INTERNET",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
        "VIBRATE"
      ],
      usesCleartextTraffic: true
    },
    web: {
      favicon: "./assets/logo.png"
    },
    extra: {
      eas: {
        projectId: "4ed359d6-b000-4308-84c0-18c93f60b0c6"
      }
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Este app precisa da sua localização para compartilhar com sua família.",
          locationAlwaysPermission: "Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.",
          locationWhenInUsePermission: "Este app precisa da sua localização quando estiver em uso.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/logo.png",
          color: "#ffffff",
          sounds: ["./assets/notification-sound.wav"]
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true
          }
        }
      ]
    ]
  }
};