package com.evercare;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class NotificationPermissionModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NotificationPermission";
    
    public NotificationPermissionModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }
    
    @Override
    public String getName() {
        return "NotificationPermission";
    }
    
    /**
     * Check if notifications are enabled for this app
     * Returns true/false via Promise
     */
    @ReactMethod
    public void areNotificationsEnabled(Promise promise) {
        try {
            NotificationManager nm = (NotificationManager) getReactApplicationContext()
                .getSystemService(Context.NOTIFICATION_SERVICE);
            boolean enabled = nm.areNotificationsEnabled();
            //Log.d(TAG, "Notifications enabled: " + enabled);
            promise.resolve(enabled);
        } catch (Exception e) {
            Log.e(TAG, "Error checking notification permission: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    /**
     * Open the app's notification settings page
     * User can manually enable notifications
     */
    @ReactMethod
    public void openNotificationSettings() {
        try {
            Intent intent = new Intent();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ - Open app notification settings
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getReactApplicationContext().getPackageName());
                Log.d(TAG, "Opening Android 8+ notification settings");
            } else {
                // Older Android - Open app details page
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
                Log.d(TAG, "Opening legacy app settings");
            }
            
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening notification settings: " + e.getMessage());
        }
    }
    
    /**
     * Open the main app settings page
     * User can manually configure all permissions
     */
    @ReactMethod
    public void openAppSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
            Log.d(TAG, "Opening app settings page");
        } catch (Exception e) {
            Log.e(TAG, "Error opening app settings: " + e.getMessage());
        }
    }
    
    /**
     * Get detailed notification info for debugging
     */
    @ReactMethod
    public void getNotificationInfo(Promise promise) {
        try {
            NotificationManager nm = (NotificationManager) getReactApplicationContext()
                .getSystemService(Context.NOTIFICATION_SERVICE);
            
            String info = "Notifications enabled: " + nm.areNotificationsEnabled() + "\n";
            info += "Device manufacturer: " + Build.MANUFACTURER + "\n";
            info += "Device model: " + Build.MODEL + "\n";
            info += "Android version: " + Build.VERSION.RELEASE + "\n";
            info += "SDK version: " + Build.VERSION.SDK_INT;
            
            Log.d(TAG, "Notification info: " + info);
            promise.resolve(info);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}