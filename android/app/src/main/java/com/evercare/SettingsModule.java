package com.evercare;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.content.Intent;
import android.util.Log;

public class SettingsModule extends ReactContextBaseJavaModule {

    private static final String TAG = "SettingsModule";
    private ReactApplicationContext reactContext;

    public SettingsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "SettingsModule";
    }

    @ReactMethod
    public void refreshCaretakerSettings(String caretakerPhone, String caretakerName, Promise promise) {
        try {
            Log.i(TAG, "=== SettingsModule.refreshCaretakerSettings called ===");
            Log.i(TAG, "Phone: " + (caretakerPhone != null ? caretakerPhone : "null"));
            Log.i(TAG, "Name: " + (caretakerName != null ? caretakerName : "null"));
            
            // Send broadcast to refresh caretaker phone in BackgroundService
            Intent refreshIntent = new Intent("com.evercare.REFRESH_CARETAKER_SETTINGS");
            refreshIntent.putExtra("caretakerPhone", caretakerPhone);
            refreshIntent.putExtra("caretakerName", caretakerName);
            // Set package to make it internal to our app
            refreshIntent.setPackage(reactContext.getPackageName());
            
            Log.i(TAG, "Sending broadcast with action: " + refreshIntent.getAction());
            Log.i(TAG, "Broadcast package: " + refreshIntent.getPackage());
            reactContext.sendBroadcast(refreshIntent);
            Log.i(TAG, "Broadcast sent successfully");
            
            String resultMessage = "Settings refresh broadcast sent with phone: " + (caretakerPhone != null ? caretakerPhone : "null");
            Log.i(TAG, "Resolving promise with: " + resultMessage);
            promise.resolve(resultMessage);
        } catch (Exception e) {
            Log.e(TAG, "Error refreshing caretaker settings: " + e.getMessage());
            e.printStackTrace();
            promise.reject("REFRESH_ERROR", e.getMessage());
        }
    }
}