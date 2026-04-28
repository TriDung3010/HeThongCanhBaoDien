#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- DANG KHOI DONG ---");
  
  WiFi.begin("Wokwi-GUEST", "");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] DA KET NOI WIFI!");
}

void loop() {
  Serial.println("He thong dang chay...");
  delay(2000);
}