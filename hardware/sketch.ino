#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // For JSON parsing/creation
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <vector> // Use vector for dynamic arrays

// --- WiFi Credentials (For Wokwi Simulation) ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// --- Backend Server ---
// IMPORTANT: Update this URL if your Ngrok tunnel changes!
const char* serverUrl = "http://7454-203-99-145-109.ngrok-free.app";

// --- Device Configuration ---
const int TABLE_NUMBER = 1; // Assign a unique table number to this device

// --- Display Setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// --- Button Pins ---
#define BUTTON1 12 // Menu/Reset
#define BUTTON2 13 // Select/Submit/Confirm Quantity
#define BUTTON3 14 // Scroll Up (Previous Item)
#define BUTTON4 18 // Scroll Down (Next Item)

// --- State Variables ---
int menuIndex = 0;
bool inQuantityMode = false;
int selectedItemIndex = -1; // Index in the vectors

// --- Dynamic Menu Data ---
std::vector<String> menuNames;
std::vector<int> menuIds;
std::vector<int> quantities;

// --- Button Debouncing ---
int lastButtonState1 = LOW, lastButtonState2 = LOW, lastButtonState3 = LOW, lastButtonState4 = LOW;
unsigned long lastDebounceTime1 = 0, lastDebounceTime2 = 0, lastDebounceTime3 = 0, lastDebounceTime4 = 0;
const unsigned long debounceDelay = 50;

// --- Function Prototypes ---
void connectWiFi();
bool fetchMenuItems();
void updateDisplay();
void updateQuantityDisplay();
void submitOrder();
void displayMessage(String line1, String line2 = "", int delayMs = 0);

// ========================================================================
// SETUP
// ========================================================================
void setup() {
  pinMode(BUTTON1, INPUT);
  pinMode(BUTTON2, INPUT);
  pinMode(BUTTON3, INPUT);
  pinMode(BUTTON4, INPUT);

  Serial.begin(115200);
  Serial.println("\nBistro92 Device Booting...");

  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;); // Don't proceed, loop forever
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Bistro 92");
  display.println("Connecting WiFi...");
  display.display();

  connectWiFi(); // Connect to WiFi

  displayMessage("Fetching Menu...", "", 500);
  if (!fetchMenuItems()) {
    displayMessage("Menu Fetch Failed!", "Check Backend/WiFi", 5000);
    // Handle error - maybe retry or halt
  } else {
     updateDisplay(); // Show the fetched menu
  }
}

// ========================================================================
// LOOP
// ========================================================================
void loop() {

  // --- Read Buttons ---
  int buttonState1 = digitalRead(BUTTON1);
  int buttonState2 = digitalRead(BUTTON2);
  int buttonState3 = digitalRead(BUTTON3); // Scroll Up Button
  int buttonState4 = digitalRead(BUTTON4); // Scroll Down Button

  // --- Button 1: Reset ---
  if (buttonState1 != lastButtonState1 && (millis() - lastDebounceTime1) > debounceDelay) {
    if (buttonState1 == HIGH && lastButtonState1 == LOW) {
      fetchMenuItems();
      Serial.println("Button 1 (Reset)");
      menuIndex = 0;
      if (!quantities.empty()) {
         std::fill(quantities.begin(), quantities.end(), 0); // Reset quantities
      }
      inQuantityMode = false;
      selectedItemIndex = -1;
      updateDisplay();
    }
    lastDebounceTime1 = millis();
  }
  lastButtonState1 = buttonState1;

  // --- Button Logic based on Mode ---
  if (!inQuantityMode) { // --- Main Menu Mode ---
    int numItems = menuNames.size();
    if (numItems == 0) return; // Don't process if no menu items

    // --- CORRECTED: Button 3 (Scroll Up / Previous Item) ---
    if (buttonState3 != lastButtonState3 && (millis() - lastDebounceTime3) > debounceDelay) {
      if (buttonState3 == HIGH && lastButtonState3 == LOW) {
        Serial.println("Button 3 (Scroll Up)");
        menuIndex = (menuIndex - 1 + numItems) % numItems; // Decrement index (with wrap-around)
        updateDisplay();
      }
      lastDebounceTime3 = millis();
    }
    lastButtonState3 = buttonState3;

    // --- CORRECTED: Button 4 (Scroll Down / Next Item) ---
    if (buttonState4 != lastButtonState4 && (millis() - lastDebounceTime4) > debounceDelay) {
      if (buttonState4 == HIGH && lastButtonState4 == LOW) {
        Serial.println("Button 4 (Scroll Down)");
        menuIndex = (menuIndex + 1) % numItems; // Increment index (with wrap-around)
        updateDisplay();
      }
      lastDebounceTime4 = millis();
    }
    lastButtonState4 = buttonState4;

    // Button 2: Select Item -> Enter Quantity Mode
    if (buttonState2 != lastButtonState2 && (millis() - lastDebounceTime2) > debounceDelay) {
      if (buttonState2 == HIGH && lastButtonState2 == LOW) {
        Serial.println("Button 2 (Select Item)");
        inQuantityMode = true;
        selectedItemIndex = menuIndex;
        updateQuantityDisplay();
      }
      lastDebounceTime2 = millis();
    }
    lastButtonState2 = buttonState2;

    // Long press Button 2 to submit order
    static unsigned long button2PressTime = 0;
    static bool button2WasPressed = false;
    if (buttonState2 == HIGH && !button2WasPressed) {
        button2PressTime = millis();
        button2WasPressed = true;
    } else if (buttonState2 == HIGH && button2WasPressed) {
        if (millis() - button2PressTime > 1500) { // 1.5 second long press
            Serial.println("Button 2 (Long Press -> Submit Order)");
            submitOrder(); // Call the updated submit function
            button2WasPressed = false; // Prevent immediate re-trigger
            // Reset state after submission attempt
            menuIndex = 0;
            if (!quantities.empty()) {
                std::fill(quantities.begin(), quantities.end(), 0);
            }
            inQuantityMode = false;
            selectedItemIndex = -1;
            // Display is updated within submitOrder or shows success/fail message
            // Optionally call updateDisplay() here if needed after a delay
        }
    } else if (buttonState2 == LOW) {
        button2WasPressed = false; // Reset press state when released
    }

  } else { // --- Quantity Adjustment Mode ---
    if (selectedItemIndex < 0 || selectedItemIndex >= quantities.size()) return; // Safety check

    // Button 3: Increase Quantity
    if (buttonState3 != lastButtonState3 && (millis() - lastDebounceTime3) > debounceDelay) {
      if (buttonState3 == HIGH && lastButtonState3 == LOW) {
        Serial.println("Button 3 (Increase Qty)");
        quantities[selectedItemIndex]++;
        updateQuantityDisplay();
      }
      lastDebounceTime3 = millis();
    }
    lastButtonState3 = buttonState3;

    // Button 4: Decrease Quantity
    if (buttonState4 != lastButtonState4 && (millis() - lastDebounceTime4) > debounceDelay) {
      if (buttonState4 == HIGH && lastButtonState4 == LOW) {
        Serial.println("Button 4 (Decrease Qty)");
        if (quantities[selectedItemIndex] > 0) {
          quantities[selectedItemIndex]--;
        }
        updateQuantityDisplay();
      }
      lastDebounceTime4 = millis();
    }
    lastButtonState4 = buttonState4;

    // Button 2: Confirm Quantity -> Return to Main Menu
    if (buttonState2 != lastButtonState2 && (millis() - lastDebounceTime2) > debounceDelay) {
      if (buttonState2 == HIGH && lastButtonState2 == LOW) {
        Serial.println("Button 2 (Confirm Qty)");
        inQuantityMode = false;
        selectedItemIndex = -1;
        updateDisplay(); // Show main menu with updated quantity
      }
      lastDebounceTime2 = millis();
    }
    lastButtonState2 = buttonState2;
  }
}

// ========================================================================
// DISPLAY FUNCTIONS (Unchanged)
// ========================================================================
void updateDisplay() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Bistro 92 Menu");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);

  int numItems = menuNames.size();
  if (numItems == 0) {
    display.setCursor(0, 15);
    display.println("No menu items.");
  } else {
    // Display logic for scrolling through items if needed (simplified here)
    // Consider adding logic to only show a few items around the current menuIndex if the list is long
    int displayStart = max(0, menuIndex - 2); // Try to show item above
    int displayEnd = min(numItems, displayStart + 4); // Show up to 4 items

    for (int i = displayStart; i < displayEnd; ++i) {
      int yPos = 15 + (i - displayStart) * 10; // Adjust yPos based on display window
      if (yPos > SCREEN_HEIGHT - 10) break; // Don't draw off screen

      display.setCursor(0, yPos);
      if (i == menuIndex) display.print("> ");
      else display.print("  ");

      display.print(menuNames[i]);
      display.print(": ");
      display.print(quantities[i]);
    }
  }
  display.display();
}

void updateQuantityDisplay() {
  if (selectedItemIndex < 0 || selectedItemIndex >= menuNames.size()) return;

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Adjust Quantity");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  display.setCursor(0, 20);
  display.print(menuNames[selectedItemIndex]);
  display.setCursor(0, 35);
  display.setTextSize(2); // Larger text for quantity
  display.print("Qty: ");
  display.print(quantities[selectedItemIndex]);
  display.setTextSize(1); // Reset text size
  display.display();
}

void displayMessage(String line1, String line2, int delayMs) {
    display.clearDisplay();
    display.setCursor(0, 15);
    display.println(line1);
    if (line2 != "") {
        display.setCursor(0, 30);
        display.println(line2);
    }
    display.display();
    if (delayMs > 0) {
        delay(delayMs);
    }
}

// ========================================================================
// NETWORKING FUNCTIONS (Updated)
// ========================================================================
void connectWiFi() {
  Serial.print("Connecting to WiFi ");
  Serial.print(ssid);
  WiFi.begin(ssid, password); // Start connection attempt

  int attempts = 0;
  // Wait for connection (or timeout) - Standard WiFi connection logic
  while (WiFi.status() != WL_CONNECTED && attempts < 20) { // Timeout after ~10 seconds
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP()); // Show the actual IP assigned by Wokwi's virtual network
    displayMessage("WiFi Connected!", WiFi.localIP().toString());
    delay(1500);
  } else {
    Serial.println("\nWiFi connection failed!");
    displayMessage("WiFi Failed!", "Check Credentials");
    // Handle failure - maybe retry or enter an offline mode?
    delay(5000);
  }
}

bool fetchMenuItems() {
  // Check WiFi status before attempting HTTP request
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot fetch menu.");
    return false;
  }

  HTTPClient http;
  String url = String(serverUrl) + "/api/menu";
  Serial.print("Fetching menu from: ");
  Serial.println(url);

  http.begin(url);
  // Add header to bypass Ngrok warning page
  http.addHeader("ngrok-skip-browser-warning", "true");

  int httpCode = http.GET();

  if (httpCode > 0) {
    Serial.printf("[HTTP] GET... code: %d\n", httpCode);
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("Received payload:");
      Serial.println(payload);

      // Clear existing menu data
      menuNames.clear();
      menuIds.clear();
      quantities.clear();

      // Parse JSON
      DynamicJsonDocument doc(1024); // Adjust size as needed
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        http.end();
        return false;
      }

      JsonArray array = doc.as<JsonArray>();
      for (JsonObject item : array) {
        int id = item["item_id"];
        String name = item["name"];

        menuIds.push_back(id);
        menuNames.push_back(name);
        quantities.push_back(0); // Initialize quantity to 0
      }
      Serial.printf("Fetched %d menu items.\n", menuNames.size());
      http.end();
      return true;

    } else {
      // Log error response from server if available
      String errorPayload = http.getString();
      Serial.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
      Serial.println("Error payload: " + errorPayload);
    }
  } else {
    Serial.printf("[HTTP] GET... connection failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  return false;
}

void submitOrder() {
  // Check WiFi status before attempting HTTP request
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot submit order.");
    displayMessage("WiFi Offline!", "Cannot Send Order", 2000);
    return;
  }

  // Create JSON document
  DynamicJsonDocument doc(512); // Adjust size based on expected items

  doc["tableNumber"] = TABLE_NUMBER;
  JsonArray itemsArray = doc.createNestedArray("items");

  bool itemsInOrder = false;
  for (int i = 0; i < quantities.size(); ++i) {
    if (quantities[i] > 0) {
      JsonObject item = itemsArray.createNestedObject();
      item["itemId"] = menuIds[i]; // Use the stored ID
      item["quantity"] = quantities[i];
      itemsInOrder = true;
    }
  }

  if (!itemsInOrder) {
      Serial.println("No items selected, order not sent.");
      displayMessage("Cart Empty!", "", 1500);
      return; // Don't send empty order
  }

  // Serialize JSON to String
  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("Submitting order:");
  Serial.println(requestBody);
  displayMessage("Sending Order...", "", 500);

  HTTPClient http;
  // --- UPDATED URL ---
  String url = String(serverUrl) + "/api/orders";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  // Add header to bypass Ngrok warning page
  http.addHeader("ngrok-skip-browser-warning", "true");

  int httpCode = http.POST(requestBody);

  if (httpCode > 0) {
    Serial.printf("[HTTP] POST... code: %d\n", httpCode);
    String responsePayload = http.getString(); // Get response even on error
    Serial.println("Response: " + responsePayload);

    // --- UPDATED SUCCESS CHECK ---
    if (httpCode == HTTP_CODE_CREATED) { // Check for 201 Created
      Serial.println("Order created successfully!");
      displayMessage("Order Sent!", "", 2000);
    } else {
      Serial.printf("[HTTP] POST... failed, code: %d\n", httpCode);
      // Try to parse error message from JSON response
      String errorMsg = "Server Error";
      DynamicJsonDocument errorDoc(256); // Small doc for error message
      DeserializationError error = deserializeJson(errorDoc, responsePayload);
      if (error == DeserializationError::Ok && errorDoc.containsKey("error")) {
          errorMsg = errorDoc["error"].as<String>();
      } else {
          // If not JSON or no "error" key, use the raw payload (truncated)
          errorMsg = responsePayload.substring(0, 32); // Show first 32 chars
      }
      displayMessage("Order Failed!", errorMsg.substring(0, 16), 3000); // Show first 16 chars on display
    }
  } else {
    Serial.printf("[HTTP] POST... connection failed, error: %s\n", http.errorToString(httpCode).c_str());
    displayMessage("Order Failed!", "Connection Error", 2000);
  }

  http.end();
}