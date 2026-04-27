export default{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "cac74a95-65dc-4f68-b31f-3854f43aa4f8"
      }
    },
    "scheme": "forgotmymeds", 
    "name": "forgotmymeds",
    "slug": "forgotmymeds",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/img/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/img/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFF8EB"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
    "package": "com.csm.forgotmymeds",
      "adaptiveIcon": {
        "foregroundImage": "./assets/img/adaptive-icon.png",
        "backgroundColor": "#FFF8EB",
        "package": "com.csm.forgotmymeds"
      },
      "edgeToEdgeEnabled": true
    },
    "web": {
      "favicon": "./assets/img/favicon.png"
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app"
    ]
  }
}