---
slug: "/blog/android-studio-v100-and-you-cant-build-your"
date: "Tue, 09 Dec 2014 05:03:00 GMT"
title: "Android Studio v1.0.0 and you can't build your project any more... here is how I fixed my project."
epoch: "1418101380"
---

It’s v1.0 time! Android Studio is updated. My project which uses Android Annotations and Proguard failed to build after the update with pretty cryptic messages.

After a few minutes digging, I was able to make it build again by applying the following patch.

```
--- a/app/build.gradle
+++ b/app/build.gradle
@@ -7,7 +7,7 @@ buildscript {
     }
     dependencies {
         // replace with the current version of the Android plugin
-        classpath 'com.android.tools.build:gradle:0.12.+'
+        classpath 'com.android.tools.build:gradle:1.0.0'
         // Since Android's Gradle plugin 0.11, you have to use android-apt >= 1.3
         classpath 'com.neenbedankt.gradle.plugins:android-apt:1.4+'
@@ -28,7 +28,7 @@ 

 apt {
     arguments {
-        androidManifestFile variant.processResources.manifestFile
+        androidManifestFile variant.outputs\[0\].processResources.manifestFile
         resourcePackageName android.defaultConfig.applicationId

         // If you're using Android NBS flavors you should use the following line
         // instead of hard-coded packageName
@@ -53,14 +53,14 @@ android {
     }
     buildTypes {
         release {
-            runProguard true
+            minifyEnabled true
             proguardFiles getDefaultProguardFile('proguard.txt'), 'proguard-rules.pro'
         }
         debug {
-            runProguard false
+            minifyEnabled false
         }
         staging {
-            runProguard true
+            minifyEnabled true
             proguardFiles getDefaultProguardFile('proguard.txt'), 'proguard-rules.pro'
         }
```         

Just postin' for someone including future myself who could struggle with it...

